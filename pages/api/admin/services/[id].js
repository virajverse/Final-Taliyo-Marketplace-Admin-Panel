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

    if (req.method === 'GET') {
      if (!rateLimit(req, res, 'admin_services_read', 300, 60 * 1000)) return
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return res.status(200).json({ data })
    }

    if (req.method === 'PATCH') {
      if (!rateLimit(req, res, 'admin_services_write', 60, 60 * 1000)) return
      const body = req.body || {}
      const updates = { ...body }
      if ('type' in updates) delete updates.type
      if (Array.isArray(updates.images)) updates.images = JSON.stringify(updates.images)
      delete updates.id
      const { data, error } = await supabase
        .from('services')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      await auditAction(req, ok, 'update', 'services', id, null, data)
      return res.status(200).json({ data })
    }

    if (req.method === 'DELETE') {
      if (!rateLimit(req, res, 'admin_services_write', 60, 60 * 1000)) return
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)
      if (error) throw error
      await auditAction(req, ok, 'delete', 'services', id, null, null)
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'method_not_allowed' })
  } catch (e) {
    return res.status(500).json({ error: 'service_failed', message: e?.message })
  }
}
