import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '../_auth'
import { rateLimit } from '../_rateLimit'
import { auditAction } from '../_audit'

export const config = {
  api: { responseLimit: false }
}

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
    if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' })
    if (!rateLimit(req, res, 'admin_download', 120, 60 * 1000)) return

    const path = req.query.path
    if (!path) return res.status(400).json({ error: 'missing_path' })

    const supabase = getAdminClient()
    const bucket = process.env.BOOKING_FILES_BUCKET || 'booking-files'
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)

    if (error || !data) return res.status(404).json({ error: 'not_found' })

    const arrayBuffer = await data.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const filename = String(path).split('/').pop() || 'file'

    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    await auditAction(req, ok, 'download', 'storage', null, null, { bucket, path })
    res.status(200).send(buffer)
  } catch (e) {
    res.status(500).json({ error: 'download_failed', message: e?.message })
  }
}
