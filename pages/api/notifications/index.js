import { supabaseAdmin } from '../../../lib/supabaseClient'

export default async function handler(req, res) {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Server not configured' })

  try {
    if (req.method === 'GET') {
      const { status, type, search, createdBy } = req.query || {}
      let query = supabaseAdmin.from('notifications').select('*').order('created_at', { ascending: false })
      if (status) query = query.eq('status', status)
      if (type) query = query.eq('type', type)
      if (search) query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`)
      if (createdBy) query = query.eq('created_by', createdBy)
      const { data, error } = await query
      if (error) throw error
      return res.status(200).json(data || [])
    }

    if (req.method === 'POST') {
      const payload = req.body || {}
      const base = {
        title: payload.title ?? null,
        message: payload.message ?? payload.body ?? null,
        body: payload.body ?? payload.message ?? null,
        recipients: Array.isArray(payload.recipients) ? payload.recipients : null,
        type: payload.type ?? null,
        channels: Array.isArray(payload.channels) && payload.channels.length ? payload.channels : ['email'],
        status: payload.status ?? (payload.scheduled_at ? 'scheduled' : 'draft'),
        created_by: payload.created_by ?? null,
        scheduled_at: payload.scheduled_at ?? null,
        sent_at: payload.sent_at ?? null,
        recipients_count: payload.recipients_count ?? null,
        read_count: payload.read_count ?? null,
        click_count: payload.click_count ?? null,
      }

      let data, error
      try {
        const resp = await supabaseAdmin.from('notifications').insert([base]).select().single()
        data = resp.data; error = resp.error
      } catch (e) {
        error = e
      }

      if (error) throw error
      return res.status(200).json(data)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Unknown error' })
  }
}
