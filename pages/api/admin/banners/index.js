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
      if (!rateLimit(req, res, 'admin_banners_read', 300, 60 * 1000)) return
      const { data, error } = await supabase
        .from('banners')
        .select('id,image_url,video_url,cta_text,cta_url,cta_align,start_at,end_at,target,duration_ms,overlay_opacity,alt_text,aria_label,active,sort_order,created_at,updated_at')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
      if (error) throw error
      return res.status(200).json({ data })
    }

    if (req.method === 'POST') {
      if (!rateLimit(req, res, 'admin_banners_write', 60, 60 * 1000)) return
      const body = req.body || {}
      const clean = {
        image_url: body.image_url?.trim() || null,
        video_url: body.video_url?.trim() || null,
        cta_text: body.cta_text?.trim() || null,
        cta_url: body.cta_url?.trim() || null,
        cta_align: ['left','center','right'].includes(body.cta_align) ? body.cta_align : 'center',
        target: ['all','mobile','desktop'].includes(body.target) ? body.target : 'all',
        duration_ms: body.duration_ms ? Number(body.duration_ms) : null,
        overlay_opacity: body.overlay_opacity !== undefined && body.overlay_opacity !== ''
          ? Math.max(0, Math.min(0.6, Number(body.overlay_opacity)))
          : null,
        alt_text: body.alt_text?.trim() || null,
        aria_label: body.aria_label?.trim() || null,
        start_at: body.start_at ? new Date(body.start_at).toISOString() : null,
        end_at: body.end_at ? new Date(body.end_at).toISOString() : null,
        active: body.active ?? true,
        sort_order: body.sort_order ?? 0,
        created_at: new Date().toISOString()
      }
      const { data, error } = await supabase
        .from('banners')
        .insert([clean])
        .select()
        .single()
      if (error) throw error
      await auditAction(req, ok, 'create', 'banners', data?.id || null, null, data)
      return res.status(201).json({ data })
    }

    return res.status(405).json({ error: 'method_not_allowed' })
  } catch (e) {
    console.error('banners_index_failed', { message: e?.message })
    return res.status(500).json({ error: 'banners_failed', message: e?.message })
  }
}
