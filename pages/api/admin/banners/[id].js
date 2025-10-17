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
      if (!rateLimit(req, res, 'admin_banners_write', 60, 60 * 1000)) return
      const body = req.body || {}
      const clean = {}
      const copy = ['image_url','video_url','cta_text','cta_url','alt_text','aria_label']
      for (const k of copy) if (k in body) clean[k] = (body[k] ?? null)
      if ('cta_align' in body) clean.cta_align = ['left','center','right'].includes(body.cta_align) ? body.cta_align : 'center'
      if ('target' in body) clean.target = ['all','mobile','desktop'].includes(body.target) ? body.target : 'all'
      if ('duration_ms' in body) clean.duration_ms = body.duration_ms ? Number(body.duration_ms) : null
      if ('overlay_opacity' in body) clean.overlay_opacity = body.overlay_opacity !== '' && body.overlay_opacity !== undefined ? Math.max(0, Math.min(0.6, Number(body.overlay_opacity))) : null
      if ('start_at' in body) clean.start_at = body.start_at ? new Date(body.start_at).toISOString() : null
      if ('end_at' in body) clean.end_at = body.end_at ? new Date(body.end_at).toISOString() : null
      if ('active' in body) clean.active = !!body.active
      if ('sort_order' in body) clean.sort_order = Number(body.sort_order) || 0
      clean.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('banners')
        .update(clean)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      await auditAction(req, ok, 'update', 'banners', id, null, clean)
      return res.status(200).json({ data })
    }

    if (req.method === 'DELETE') {
      if (!rateLimit(req, res, 'admin_banners_write', 60, 60 * 1000)) return
      const { error } = await supabase.from('banners').delete().eq('id', id)
      if (error) throw error
      await auditAction(req, ok, 'delete', 'banners', id, null, null)
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'method_not_allowed' })
  } catch (e) {
    console.error('banners_id_failed', { message: e?.message })
    return res.status(500).json({ error: 'banners_failed', message: e?.message })
  }
}
