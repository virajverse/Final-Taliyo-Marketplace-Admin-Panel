import { setAuthCookie } from '../_auth'
import { rateLimit } from '../_rateLimit'
import { auditAction } from '../_audit'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  try {
    if (!rateLimit(req, res, 'admin_login', 10, 60 * 1000)) return
    const { email, password } = req.body || {}
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD
    const adminName = process.env.ADMIN_NAME || process.env.NEXT_PUBLIC_ADMIN_NAME || 'Admin'

    if (!adminEmail || !adminPassword) return res.status(500).json({ error: 'missing_env' })
    if (email !== adminEmail || password !== adminPassword) return res.status(401).json({ error: 'invalid_credentials' })

    setAuthCookie(res, { email })
    await auditAction(req, { email }, 'login', 'admins', null, null, { email })
    return res.status(200).json({ ok: true, name: adminName })
  } catch (e) {
    return res.status(500).json({ error: 'login_failed' })
  }
}
