import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  try {
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
        items (title, type),
        services (title)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    const recentActivity = (clicksRows || []).map(c => ({
      action: 'Order Click',
      user: c.user_ip || 'Visitor',
      target: c.services?.title || c.items?.title || 'Unknown',
      timestamp: new Date(c.created_at).toISOString(),
      status: 'Success'
    }))

    const now = new Date()
    const months = Array.from({ length: 12 }, (_, i) => {
      const start = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
      const end = new Date(now.getFullYear(), now.getMonth() - (11 - i) + 1, 1)
      return { start, end }
    })

    const perfCounts = []
    for (const m of months) {
      const { count } = await supabase
        .from('order_clicks')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', m.start.toISOString())
        .lt('created_at', m.end.toISOString())
      perfCounts.push(count || 0)
    }
    const performanceData = months.map((m, i) => ({
      month: m.start.toLocaleDateString('en-US', { month: 'short' }),
      growth: perfCounts[i]
    }))

    // Category distribution: top service categories by share
    const { data: cats } = await supabase
      .from('categories')
      .select('id,name')
      .eq('is_active', true)

    const counts = []
    for (const cat of (cats || [])) {
      const { count } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('category_id', cat.id)
      counts.push({ name: cat.name, count: count || 0 })
    }
    counts.sort((a, b) => b.count - a.count)
    const top = counts.slice(0, 3)
    const totalTop = top.reduce((s, r) => s + r.count, 0)
    const palette = ['#8B5CF6', '#06B6D4', '#10B981']
    const categoryData = top.length
      ? top.map((t, i) => ({ name: t.name, value: totalTop ? Math.round((t.count / totalTop) * 100) : 0, color: palette[i % palette.length] }))
      : [{ name: 'Services', value: 100, color: '#8B5CF6' }]

    const conversionRate = clicksCount ? Number((((bookingsCount || 0) / clicksCount) * 100).toFixed(1)) : 0

    return res.status(200).json({
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
    })
  } catch (err) {
    return res.status(500).json({ error: 'metrics_failed', message: err?.message })
  }
}
