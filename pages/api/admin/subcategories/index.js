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

  try {
    const supabase = getAdminClient()

    if (req.method === 'GET') {
      if (!rateLimit(req, res, 'admin_subcategories_read', 300, 60 * 1000)) return
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return res.status(200).json({ data })
    }

    if (req.method === 'POST') {
      if (!rateLimit(req, res, 'admin_subcategories_write', 60, 60 * 1000)) return
      const { category_id, name, slug, is_active = true, sort_order = 0 } = req.body || {}
      if (!category_id || !name || !slug) return res.status(400).json({ error: 'missing_fields' })
      const payload = { category_id, name, slug, is_active, sort_order: Number(sort_order) || 0, created_at: new Date().toISOString() }
      const { data, error } = await supabase
        .from('subcategories')
        .insert([payload])
        .select()
        .single()
      if (error) throw error
      await auditAction(req, ok, 'create', 'subcategories', data?.id || null, null, data)
      return res.status(201).json({ data })
    }

    return res.status(405).json({ error: 'method_not_allowed' })
  } catch (e) {
    return res.status(500).json({ error: 'subcategories_failed', message: e?.message })
  }
}
