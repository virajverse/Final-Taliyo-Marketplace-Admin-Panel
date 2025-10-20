import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from './_auth'
import { rateLimit } from './_rateLimit'

function startOfDay(d){ const x=new Date(d); x.setHours(0,0,0,0); return x }
function fmtDate(d){ return d.toLocaleDateString('en-US',{ month:'short', day:'numeric' }) }

export default async function handler(req, res) {
  const ok = requireAdmin(req, res)
  if (!ok) return
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      return res.status(500).json({ error: 'missing_env' })
    }

    const days = Math.max(1, Math.min(365, parseInt(req.query.days || '30', 10)))

    if (!rateLimit(req, res, 'admin_analytics_read', 120, 60 * 1000)) return

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Headline metrics
    const [servicesRes, clicksRes, avgReviewsRes] = await Promise.all([
      supabase.from('services').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('order_clicks').select('*', { count: 'exact', head: true }),
      supabase.from('reviews').select('rating').eq('is_approved', true)
    ])

    const totalItems = servicesRes.count || 0
    const totalClicks = clicksRes.count || 0
    const avgRating = (avgReviewsRes.data || []).length
      ? Number(((avgReviewsRes.data || []).reduce((s, r) => s + Number(r.rating || 0), 0) / (avgReviewsRes.data || []).length).toFixed(1))
      : 0

    // Total revenue (all time) and growth data (last N days)
    const [{ data: allRevRows }, { data: periodBookings } ] = await Promise.all([
      supabase
        .from('bookings')
        .select('final_price,status')
        .in('status', ['confirmed', 'completed'])
        .not('final_price', 'is', null),
      supabase
        .from('bookings')
        .select('final_price,status,created_at,service_id')
        .in('status', ['confirmed', 'completed'])
        .not('final_price', 'is', null)
        .gte('created_at', startOfDay(new Date(Date.now() - (days-1)*24*60*60*1000)).toISOString())
    ])

    const totalRevenue = (allRevRows || []).reduce((sum, r) => sum + Number(r.final_price || 0), 0)

    // Revenue growth data per day
    const dayBuckets = []
    for (let i = days - 1; i >= 0; i--) {
      const day = startOfDay(new Date(Date.now() - i*24*60*60*1000))
      dayBuckets.push(day)
    }
    const revenueByDay = new Map()
    for (const d of dayBuckets) revenueByDay.set(d.toDateString(), 0)
    for (const b of periodBookings || []) {
      const key = startOfDay(new Date(b.created_at)).toDateString()
      if (revenueByDay.has(key)) {
        revenueByDay.set(key, (revenueByDay.get(key) || 0) + Number(b.final_price || 0))
      }
    }
    const growthData = dayBuckets.map(d => ({ date: fmtDate(d), revenue: Math.round(revenueByDay.get(d.toDateString()) || 0) }))

    // Category distribution from services by category
    const [{ data: cats }, { data: svcCats }] = await Promise.all([
      supabase.from('categories').select('id,name').eq('is_active', true),
      supabase.from('services').select('category_id').eq('is_active', true)
    ])
    const cmap = new Map()
    for (const r of (svcCats || [])) {
      const id = r.category_id
      if (!id) continue
      cmap.set(id, (cmap.get(id) || 0) + 1)
    }
    const arr = (cats || []).map(c => ({ name: c.name, count: cmap.get(c.id) || 0 }))
    arr.sort((a, b) => b.count - a.count)
    const top3 = arr.slice(0, 3)
    const totalTop = top3.reduce((s, r) => s + r.count, 0)
    const palette = ['#8B5CF6', '#06B6D4', '#10B981']
    const categoryData = top3.length
      ? top3.map((t, i) => ({ name: t.name, value: totalTop ? Math.round((t.count / totalTop) * 100) : 0, color: palette[i % palette.length] }))
      : [{ name: 'Services', value: 100, color: '#8B5CF6' }]

    // Click trends last 7 days
    const trendDays = 7
    const trendStart = startOfDay(new Date(Date.now() - (trendDays-1)*24*60*60*1000))
    const { data: clicksRows } = await supabase
      .from('order_clicks')
      .select('created_at')
      .gte('created_at', trendStart.toISOString())

    const clicksByDay = new Map()
    for (let i = trendDays - 1; i >= 0; i--) {
      const d = startOfDay(new Date(Date.now() - i*24*60*60*1000))
      clicksByDay.set(d.toDateString(), 0)
    }
    for (const c of clicksRows || []) {
      const key = startOfDay(new Date(c.created_at)).toDateString()
      clicksByDay.set(key, (clicksByDay.get(key) || 0) + 1)
    }
    const clickTrends = Array.from(clicksByDay.entries()).map(([k, v]) => ({ label: fmtDate(new Date(k)), growth: v }))

    // Top services (by clicks in range) with revenue in range
    const { data: rangeClicks } = await supabase
      .from('order_clicks')
      .select('service_id, created_at, services(title)')
      .gte('created_at', startOfDay(new Date(Date.now() - (days-1)*24*60*60*1000)).toISOString())

    const clicksByService = new Map() // id -> {name, clicks}
    for (const r of rangeClicks || []) {
      if (!r.service_id) continue
      const key = r.service_id
      const curr = clicksByService.get(key) || { name: r.services?.title || 'Unknown', clicks: 0 }
      curr.clicks += 1
      clicksByService.set(key, curr)
    }

    // revenue by service in same period
    const revenueByService = new Map()
    for (const b of periodBookings || []) {
      if (!b.service_id) continue
      revenueByService.set(b.service_id, (revenueByService.get(b.service_id) || 0) + Number(b.final_price || 0))
    }

    const topItems = Array.from(clicksByService.entries())
      .map(([id, v]) => ({ name: v.name, clicks: v.clicks, revenue: Math.round(revenueByService.get(id) || 0) }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 4)

    return res.status(200).json({
      totalRevenue: Math.round(totalRevenue),
      totalItems,
      totalClicks,
      avgRating,
      growthData,
      categoryData,
      clickTrends,
      topItems
    })
  } catch (err) {
    return res.status(500).json({ error: 'analytics_failed', message: err?.message })
  }
}
