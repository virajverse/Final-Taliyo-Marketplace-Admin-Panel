import { setAuthCookie } from '../_auth'
import { rateLimit } from '../_rateLimit'
import { auditAction } from '../_audit'

// In-memory login throttle: backoff IPs with repeated failures
const attempts = new Map()
const getIp = (req) => {
  const xf = req.headers['x-forwarded-for']
  if (typeof xf === 'string' && xf.length) return xf.split(',')[0].trim()
  const xr = req.headers['x-real-ip']
  if (typeof xr === 'string' && xr.length) return xr
  return req.socket?.remoteAddress || 'unknown'
}
const isBlocked = (ip) => {
  const info = attempts.get(ip)
  if (!info) return false
  const now = Date.now()
  if (info.blockUntil && now < info.blockUntil) return true
  return false
}
const recordFailure = (ip) => {
  const now = Date.now()
  const info = attempts.get(ip) || { fails: 0, last: 0, blockUntil: 0 }
  // decay old failures after 10 minutes
  if (now - info.last > 10 * 60 * 1000) info.fails = 0
  info.fails += 1
  info.last = now
  if (info.fails >= 5) {
    // block for 15 minutes
    info.blockUntil = now + 15 * 60 * 1000
    info.fails = 0
  }
  attempts.set(ip, info)
}
const recordSuccess = (ip) => {
  attempts.delete(ip)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  try {
    if (!rateLimit(req, res, 'admin_login', 10, 60 * 1000)) return
    const ip = getIp(req)
    if (isBlocked(ip)) return res.status(429).json({ error: 'try_later' })
    const { email, password } = req.body || {}
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD
    const adminName = process.env.ADMIN_NAME || process.env.NEXT_PUBLIC_ADMIN_NAME || 'Admin'
    const jwtSecret = process.env.ADMIN_JWT_SECRET

    if (!adminEmail || !adminPassword) return res.status(500).json({ error: 'missing_env' })
    if (!jwtSecret) return res.status(500).json({ error: 'missing_admin_jwt_secret' })
    if (email !== adminEmail || password !== adminPassword) { recordFailure(ip); return res.status(401).json({ error: 'invalid_credentials' }) }

    setAuthCookie(res, { email })
    recordSuccess(ip)
    await auditAction(req, { email }, 'login', 'admins', null, null, { email })
    return res.status(200).json({ ok: true, name: adminName })
  } catch (e) {
    return res.status(500).json({ error: 'login_failed', message: e?.message || 'failed' })
  }
}
