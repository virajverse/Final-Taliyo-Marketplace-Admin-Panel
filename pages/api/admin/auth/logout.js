import { clearAuthCookie } from '../_auth'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  try {
    clearAuthCookie(res)
    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: 'logout_failed' })
  }
}
