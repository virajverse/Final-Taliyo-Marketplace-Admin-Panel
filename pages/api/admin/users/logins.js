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

    const { q = '', limit = 1000 } = req.query
    const cap = Math.min(Number(limit) || 1000, 5000)

    const { data: rows, error } = await supabase
      .from('analytics')
      .select('id,event_type,event_data,user_ip,user_agent,created_at')
      .eq('event_type', 'user_login')
      .order('created_at', { ascending: false })
      .limit(cap)

    if (error) return res.status(500).json({ error: error.message })

    const qstr = String(q || '').toLowerCase()
    const events = (rows || []).filter(r => {
      if (!qstr) return true
      const ed = r.event_data || {}
      const email = String(ed.email || '').toLowerCase()
      const phone = String(ed.phone || '').toLowerCase()
      const uid = String(ed.userId || '').toLowerCase()
      return email.includes(qstr) || phone.includes(qstr) || uid.includes(qstr)
    })

    const byUser = new Map()
    for (const e of events) {
      const ed = e.event_data || {}
      const uid = ed.userId || 'unknown'
      if (!byUser.has(uid)) {
        byUser.set(uid, { userId: uid, email: ed.email || null, phone: ed.phone || null, last_login: e.created_at, count: 0, events: [] })
      }
      const u = byUser.get(uid)
      u.count += 1
      if (e.created_at > u.last_login) u.last_login = e.created_at
      // prefer the latest non-null email/phone
      if (ed.email) u.email = ed.email
      if (ed.phone) u.phone = ed.phone
      if (u.events.length < 200) u.events.push(e)
    }

    const users = Array.from(byUser.values()).sort((a, b) => new Date(b.last_login) - new Date(a.last_login))

    return res.status(200).json({ users, eventsCount: events.length })
  } catch (e) {
    return res.status(500).json({ error: 'failed', message: e?.message })
  }
}
