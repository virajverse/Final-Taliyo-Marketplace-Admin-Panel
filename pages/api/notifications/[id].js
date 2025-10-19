import { supabaseAdmin } from '../../../lib/supabaseClient'

export default async function handler(req, res) {
  if (!supabaseAdmin) return res.status(500).json({ error: 'Server not configured' })

  const { id } = req.query || {}
  if (!id) return res.status(400).json({ error: 'Missing id' })

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin.from('notifications').select('*').eq('id', id).single()
      if (error) throw error
      return res.status(200).json(data)
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const updates = req.body || {}
      const { data, error } = await supabaseAdmin.from('notifications').update(updates).eq('id', id).select().single()
      if (error) throw error
      return res.status(200).json(data)
    }

    if (req.method === 'DELETE') {
      const { error } = await supabaseAdmin.from('notifications').delete().eq('id', id)
      if (error) throw error
      return res.status(200).json({ ok: true })
    }

    res.setHeader('Allow', ['GET', 'PUT', 'PATCH', 'DELETE'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Unknown error' })
  }
}
