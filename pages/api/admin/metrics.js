import { createClient } from '@supabase/supabase-js'
import { rateLimit } from './_rateLimit'
import { requireAdmin } from './_auth'

// Simple in-memory cache (per Vercel instance)
let CACHE = { at: 0, data: null }
const TTL_MS = 30 * 1000

export default async function handler(req, res) {
  try {
    // Require admin before anything else
    const ok = requireAdmin(req, res)
    if (!ok) return

    // Rate limit
    if (!rateLimit(req, res, 'admin_metrics', 30, 60_000)) return

    // Serve from in-memory cache (instance-local)
    const now = Date.now()
    if (CACHE.data && (now - CACHE.at) < TTL_MS) {
      res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate')
      return res.status(200).json(CACHE.data)
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: 'missing_env' })
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const [servicesRes, clicksRes, adminsRes] = await Promise.all([
      supabase.from('services').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('order_clicks').select('*', { count: 'exact', head: true }),
      supabase.from('admins').select('*', { count: 'exact', head: true }).eq('is_active', true)
    ])

    const itemsCount = servicesRes.count || 0
    const clicksCount = clicksRes.count || 0
    const adminsCount = adminsRes.count || 0

    const yesterdayISO = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: recentClicks = 0 } = await supabase
      .from('order_clicks')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterdayISO)

    const { count: bookingsCount = 0 } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })

    let totalRevenue = 0
    let thisMonthRevenue = 0
    const { data: revRows } = await supabase
      .from('bookings')
      .select('final_price,status,created_at')
      .in('status', ['confirmed', 'completed'])
      .not('final_price', 'is', null)

    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    for (const r of revRows || []) {
      const price = Number(r.final_price || 0)
      totalRevenue += price
      const created = new Date(r.created_at)
      if (created >= monthStart) thisMonthRevenue += price
    }

    const { data: clicksRows } = await supabase
      .from('order_clicks')
      .select(`
        *,
        services (title)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    const recentActivity = (clicksRows || []).map(c => ({
      action: 'Order Click',
      user: c.user_ip || 'Visitor',
      target: c.services?.title || 'Unknown',
      timestamp: new Date(c.created_at).toISOString(),
      status: 'Success'
    }))

    // Performance: single query for last 12 months then bucket in code
    const nowDt = new Date()
    const start12 = new Date(nowDt.getFullYear(), nowDt.getMonth() - 11, 1)
    const { data: perfRows } = await supabase
      .from('order_clicks')
      .select('created_at')
      .gte('created_at', start12.toISOString())

    const months = Array.from({ length: 12 }, (_, i) => new Date(nowDt.getFullYear(), nowDt.getMonth() - (11 - i), 1))
    const counts = new Array(12).fill(0)
    for (const r of (perfRows || [])) {
      const d = new Date(r.created_at)
      const index = (d.getFullYear() - months[0].getFullYear()) * 12 + (d.getMonth() - months[0].getMonth())
      if (index >= 0 && index < 12) counts[index]++
    }
    const performanceData = months.map((m, i) => ({
      month: m.toLocaleDateString('en-US', { month: 'short' }),
      growth: counts[i]
    }))

    // Category distribution: top service categories by share
    // Category distribution: 2 queries (cats + service category_ids), compute in code
    const [{ data: cats }, { data: svcCats }] = await Promise.all([
      supabase.from('categories').select('id,name').eq('is_active', true),
      supabase.from('services').select('category_id').eq('is_active', true)
    ])

    const catMap = new Map()
    for (const sc of (svcCats || [])) {
      const id = sc.category_id
      if (!id) continue
      catMap.set(id, (catMap.get(id) || 0) + 1)
    }
    const countsArr = (cats || []).map(c => ({ name: c.name, count: catMap.get(c.id) || 0 }))
    countsArr.sort((a, b) => b.count - a.count)
    const top = countsArr.slice(0, 3)
    const totalTop = top.reduce((s, r) => s + r.count, 0)
    const palette = ['#8B5CF6', '#06B6D4', '#10B981']
    const categoryData = top.length
      ? top.map((t, i) => ({ name: t.name, value: totalTop ? Math.round((t.count / totalTop) * 100) : 0, color: palette[i % palette.length] }))
      : [{ name: 'Services', value: 100, color: '#8B5CF6' }]

    const conversionRate = clicksCount ? Number((((bookingsCount || 0) / clicksCount) * 100).toFixed(1)) : 0

    const payload = {
      totalItems: itemsCount,
      totalClicks: clicksCount,
      totalAdmins: adminsCount,
      recentClicks,
      bookingsCount: bookingsCount || 0,
      totalRevenue,
      thisMonthRevenue,
      recentActivity,
      performanceData,
      categoryData,
      conversionRate
    }

    CACHE = { at: Date.now(), data: payload }
    res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate')
    return res.status(200).json(payload)
  } catch (err) {
    return res.status(500).json({ error: 'metrics_failed', message: err?.message })
  }
}
