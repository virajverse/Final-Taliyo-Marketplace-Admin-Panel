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

const getClientForRead = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url) throw new Error('missing_env')
  const key = serviceKey || anonKey
  if (!key) throw new Error('missing_env')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export default async function handler(req, res) {
  const ok = requireAdmin(req, res)
  if (!ok) return

  try {
    const supabase = req.method === 'GET' ? getClientForRead() : getAdminClient()

    if (req.method === 'GET') {
      if (!rateLimit(req, res, 'admin_banners_limit_read', 300, 60 * 1000)) return
      const { data: row, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'home_banner_limit')
        .maybeSingle()
      if (error) throw error
      const value = row?.value ? Number(row.value) : 3
      return res.status(200).json({ value: Number.isFinite(value) && value > 0 ? value : 3 })
    }

    if (req.method === 'PUT') {
      if (!rateLimit(req, res, 'admin_banners_limit_write', 60, 60 * 1000)) return
      const { value } = req.body || {}
      const n = Math.max(1, Number(value) || 3)
      const v = String(n)

      const { data: exists } = await supabase
        .from('site_settings')
        .select('key')
        .eq('key', 'home_banner_limit')
        .maybeSingle()

      if (exists) {
        const { error } = await supabase.from('site_settings').update({ value: v }).eq('key', 'home_banner_limit')
        if (error) throw error
      } else {
        const { error } = await supabase.from('site_settings').insert([{ key: 'home_banner_limit', value: v }])
        if (error) throw error
      }
      await auditAction(req, ok, 'update', 'site_settings', 'home_banner_limit', null, { value: v })
      return res.status(200).json({ ok: true, value: n })
    }

    return res.status(405).json({ error: 'method_not_allowed' })
  } catch (e) {
    const msg = e?.message || ''
    console.error('banners_limit_failed', { message: msg })
    if (req.method === 'GET') {
      // Degraded read: return default value to avoid UI breaking
      return res.status(200).json({ value: 3, degraded: true, message: msg })
    }
    return res.status(500).json({ error: 'banners_failed', message: msg })
  }
}
