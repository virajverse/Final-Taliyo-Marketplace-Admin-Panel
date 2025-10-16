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

    const { days = '7', q = '', limit = '500' } = req.query
    const cap = Math.min(Number(limit) || 500, 2000)
    const d = Math.max(Number(days) || 7, 1)
    const since = new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString()

    let query = supabase
      .from('bookings')
      .select('id,created_at,status,customer_name,customer_phone,customer_email,full_name,phone,email,service_title,service_price,cart_items')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(cap)

    // Only cart orders (cart_items not null)
    query = query.not('cart_items', 'is', null)

    const { data: rows, error } = await query
    if (error) return res.status(500).json({ error: error.message })

    const qstr = String(q || '').toLowerCase().trim()
    const filtered = !qstr
      ? rows || []
      : (rows || []).filter(r => {
          const email = String(r.customer_email || r.email || '').toLowerCase()
          const phone = String(r.customer_phone || r.phone || '').toLowerCase()
          const name = String(r.customer_name || r.full_name || '').toLowerCase()
          return email.includes(qstr) || phone.includes(qstr) || name.includes(qstr)
        })

    return res.status(200).json({ bookings: filtered, count: filtered.length, days: d })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'failed' })
  }
}
