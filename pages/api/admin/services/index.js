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
      if (!rateLimit(req, res, 'admin_services_read', 300, 60 * 1000)) return
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return res.status(200).json({ data })
    }

    if (req.method === 'POST') {
      if (!rateLimit(req, res, 'admin_services_write', 60, 60 * 1000)) return
      const body = req.body || {}
      const payload = {
        title: body.title || 'Untitled',
        description: body.description || null,
        category_id: body.category_id || null,
        subcategory_id: body.subcategory_id || null,
        price_min: body.price_min != null && body.price_min !== '' ? Number(body.price_min) : null,
        price_max: body.price_max != null && body.price_max !== '' ? Number(body.price_max) : null,
        price_type: body.price_type || 'fixed',
        duration_minutes: body.duration_minutes != null && body.duration_minutes !== '' ? Number(body.duration_minutes) : null,
        location: body.location || null,
        is_remote: !!body.is_remote,
        images: Array.isArray(body.images) ? JSON.stringify(body.images) : (typeof body.images === 'string' ? body.images : '[]'),
        provider_name: body.provider_name || null,
        provider_avatar: body.provider_avatar || null,
        provider_bio: body.provider_bio || null,
        provider_phone: body.provider_phone || null,
        provider_email: body.provider_email || null,
        is_active: body.is_active !== false,
        is_featured: !!body.is_featured,
        created_at: new Date().toISOString()
      }
      const { data, error } = await supabase
        .from('services')
        .insert([payload])
        .select()
        .single()
      if (error) throw error
      await auditAction(req, ok, 'create', 'services', data?.id || null, null, data)
      return res.status(201).json({ data })
    }

    return res.status(405).json({ error: 'method_not_allowed' })
  } catch (e) {
    console.error('services_failed', {
      message: e?.message,
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    })
    return res.status(500).json({ error: 'services_failed', message: e?.message })
  }
}
