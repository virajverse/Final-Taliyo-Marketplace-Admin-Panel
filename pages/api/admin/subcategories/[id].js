import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '../_auth'
import { rateLimit } from '../_rateLimit'
import { auditAction } from '../_audit'

const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('missing_env')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export default async function handler(req, res) {
  const ok = requireAdmin(req, res)
  if (!ok) return

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'missing_id' })

  try {
    const supabase = getAdminClient()

    if (req.method === 'PATCH') {
      if (!rateLimit(req, res, 'admin_subcategories_write', 60, 60 * 1000)) return
      const updates = req.body || {}
      delete updates.id
      const { data, error } = await supabase
        .from('subcategories')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      await auditAction(req, ok, 'update', 'subcategories', id, null, data)
      return res.status(200).json({ data })
    }

    if (req.method === 'DELETE') {
      if (!rateLimit(req, res, 'admin_subcategories_write', 60, 60 * 1000)) return
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id)
      if (error) throw error
      await auditAction(req, ok, 'delete', 'subcategories', id, null, null)
      return res.status(200).json({ ok: true })
    }

    if (req.method === 'GET') {
      if (!rateLimit(req, res, 'admin_subcategories_read', 300, 60 * 1000)) return
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return res.status(200).json({ data })
    }

    return res.status(405).json({ error: 'method_not_allowed' })
  } catch (e) {
    return res.status(500).json({ error: 'subcategory_failed', message: e?.message })
  }
}
