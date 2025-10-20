import { requireAdmin } from '../_auth'

export default async function handler(req, res) {
  try {
    const payload = requireAdmin(req, res)
    if (!payload) return

    const adminName = process.env.ADMIN_NAME || process.env.NEXT_PUBLIC_ADMIN_NAME || 'Admin'
    return res.status(200).json({
      ok: true,
      admin: {
        email: payload.email,
        name: adminName,
        role: 'super_admin',
      },
    })
  } catch (e) {
    return res.status(401).json({ error: 'unauthorized' })
  }
}
