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
      if ('duration_ms' in body) {
        const dm = Number(body.duration_ms)
        clean.duration_ms = Number.isFinite(dm) ? dm : null
      }
      if ('overlay_opacity' in body) {
        const oo = Number(body.overlay_opacity)
        clean.overlay_opacity = (body.overlay_opacity !== '' && body.overlay_opacity !== undefined && Number.isFinite(oo))
          ? Math.max(0, Math.min(0.6, oo))
          : null
      }
      if ('start_at' in body) {
        const ts = Date.parse(body.start_at)
        clean.start_at = Number.isFinite(ts) ? new Date(ts).toISOString() : null
      }
      if ('end_at' in body) {
        const te = Date.parse(body.end_at)
        clean.end_at = Number.isFinite(te) ? new Date(te).toISOString() : null
      }
      if ('active' in body) clean.active = !!(body.active === true || body.active === 'true')
      if ('sort_order' in body) {
        const so = Number(body.sort_order)
        clean.sort_order = Number.isFinite(so) ? so : 0
      }
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
