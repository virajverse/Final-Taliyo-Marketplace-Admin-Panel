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

  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  if (!rateLimit(req, res, 'admin_banners_reorder', 120, 60 * 1000)) return

  try {
    const { order } = req.body || {}
    if (!Array.isArray(order) || !order.length) return res.status(400).json({ error: 'invalid_order' })

    const supabase = getAdminClient()
    // Update sort_order in sequence
    for (let i = 0; i < order.length; i++) {
      const id = order[i]
      const { error } = await supabase.from('banners').update({ sort_order: i }).eq('id', id)
      if (error) throw error
    }

    await auditAction(req, ok, 'update', 'banners', null, null, { reorder: order })
    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('banners_reorder_failed', { message: e?.message })
    return res.status(500).json({ error: 'banners_failed', message: e?.message })
  }
}
