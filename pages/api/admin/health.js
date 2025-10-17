import { requireAdmin } from './_auth'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' })
  const payload = requireAdmin(req, res)
  if (!payload) return // requireAdmin already sent 401
  return res.status(200).json({ ok: true, email: payload.email })
}
