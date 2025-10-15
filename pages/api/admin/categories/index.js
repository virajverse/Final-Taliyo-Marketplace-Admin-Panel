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
      if (!rateLimit(req, res, 'admin_categories_read', 300, 60 * 1000)) return
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return res.status(200).json({ data })
    }

    if (req.method === 'POST') {
      if (!rateLimit(req, res, 'admin_categories_write', 60, 60 * 1000)) return
      const { name, slug, description = '', icon = '', sort_order = 0, is_active = true } = req.body || {}
      if (!name || !slug) return res.status(400).json({ error: 'missing_fields' })
      const payload = { name, slug, description, icon, sort_order: Number(sort_order) || 0, is_active, created_at: new Date().toISOString() }
      const { data, error } = await supabase
        .from('categories')
        .insert([payload])
        .select()
        .single()
      if (error) throw error
      await auditAction(req, ok, 'create', 'categories', data?.id || null, null, data)
      return res.status(201).json({ data })
    }

    return res.status(405).json({ error: 'method_not_allowed' })
  } catch (e) {
    return res.status(500).json({ error: 'categories_failed', message: e?.message })
  }
}
