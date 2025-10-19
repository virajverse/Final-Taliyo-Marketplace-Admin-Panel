import { supabaseAdmin } from '../../../lib/supabaseClient'

export default async function handler(req, res) {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Server not configured' })

  try {
    if (req.method === 'GET') {
      const { status, type, search } = req.query || {}
      let query = supabaseAdmin.from('campaigns').select('*').order('created_at', { ascending: false })
      if (status) query = query.eq('status', status)
      if (type) query = query.eq('type', type)
      if (search) query = query.or(`name.ilike.%${search}%,subject.ilike.%${search}%`)
      const { data, error } = await query
      if (error) throw error
      return res.status(200).json(data || [])
    }

    if (req.method === 'POST') {
      const payload = req.body || {}
      const { data, error } = await supabaseAdmin.from('campaigns').insert([{ ...payload }]).select().single()
      if (error) throw error
      return res.status(200).json(data)
    }

    res.setHeader('Allow', ['GET', 'POST'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Unknown error' })
  }
}
