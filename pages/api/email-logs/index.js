import { supabaseAdmin } from '../../../lib/supabaseClient'

export default async function handler(req, res) {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Server not configured' })

  try {
    if (req.method === 'GET') {
      const { limit } = req.query || {}
      let query = supabaseAdmin.from('email_logs').select('*').order('sent_at', { ascending: false })
      if (limit) query = query.limit(Number(limit))
      const { data, error } = await query
      if (error) throw error
      return res.status(200).json(data || [])
    }

    if (req.method === 'POST') {
      const payload = req.body || {}
      const base = {
        from_email: payload.from_email,
        to_emails: Array.isArray(payload.to_emails) ? payload.to_emails : [],
        cc_emails: Array.isArray(payload.cc_emails) ? payload.cc_emails : [],
        bcc_emails: Array.isArray(payload.bcc_emails) ? payload.bcc_emails : [],
        subject: payload.subject,
        text_content: payload.text_content || null,
        html_content: payload.html_content || null,
        message_id: payload.message_id || null,
        sent_by: payload.sent_by || null,
        sent_at: payload.sent_at || null,
      }
      const { data, error } = await supabaseAdmin.from('email_logs').insert([base]).select().single()
      if (error) throw error
      return res.status(200).json(data)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Unknown error' })
  }
}
