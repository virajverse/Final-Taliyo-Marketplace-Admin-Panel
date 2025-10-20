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

const KEYS = {
  profile: 'admin_profile',
  notifications: 'admin_notification_settings',
  system: 'admin_system_settings',
}

export default async function handler(req, res) {
  const ok = requireAdmin(req, res)
  if (!ok) return

  try {
    const supabase = getAdminClient()

    if (req.method === 'GET') {
      if (!rateLimit(req, res, 'admin_settings_read', 120, 60 * 1000)) return
      const { data, error } = await supabase
        .from('site_settings')
        .select('key,value')
        .in('key', [KEYS.profile, KEYS.notifications, KEYS.system])
      if (error) throw error

      const map = new Map((data || []).map(r => [r.key, r.value]))
      const parseJson = (v, fallback) => {
        try { return v ? JSON.parse(v) : fallback } catch { return fallback }
      }

      const payload = {
        profile: parseJson(map.get(KEYS.profile), { name: '', email: ok.email || '', phone: '', bio: '' }),
        notifications: parseJson(map.get(KEYS.notifications), { emailNotifications: false, newBookings: false, newMessages: false, weeklyReports: false, marketingEmails: false }),
        system: parseJson(map.get(KEYS.system), { maintenanceMode: false, allowRegistrations: true, autoApproveServices: false, maxFileSize: '10', supportEmail: '' })
      }

      return res.status(200).json(payload)
    }

    if (req.method === 'PUT') {
      if (!rateLimit(req, res, 'admin_settings_write', 60, 60 * 1000)) return
      const body = req.body || {}

      const upserts = []
      const now = new Date().toISOString()

      if (body.profile) {
        upserts.push({ key: KEYS.profile, value: JSON.stringify(body.profile), updated_at: now })
      }
      if (body.notifications) {
        upserts.push({ key: KEYS.notifications, value: JSON.stringify(body.notifications), updated_at: now })
      }
      if (body.system) {
        upserts.push({ key: KEYS.system, value: JSON.stringify(body.system), updated_at: now })
      }

      if (upserts.length === 0) return res.status(400).json({ error: 'nothing_to_update' })

      const { error } = await supabase.from('site_settings').upsert(upserts, { onConflict: 'key' })
      if (error) throw error

      await auditAction(req, ok, 'update', 'site_settings', null, null, upserts)
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'method_not_allowed' })
  } catch (e) {
    return res.status(500).json({ error: 'settings_failed', message: e?.message })
  }
}
