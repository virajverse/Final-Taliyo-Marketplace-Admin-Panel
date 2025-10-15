import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '../_auth'
import { rateLimit } from '../_rateLimit'
import { auditAction } from '../_audit'
import formidable from 'formidable'

export const config = {
  api: { bodyParser: false }
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

  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  try {
    if (!rateLimit(req, res, 'admin_upload', 30, 60 * 1000)) return
    const form = formidable({ multiples: false })
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        else resolve({ fields, files })
      })
    })

    const file = files.file
    if (!file) return res.status(400).json({ error: 'missing_file' })

    const supabase = getAdminClient()
    const bucket = process.env.SERVICE_IMAGES_BUCKET || 'service-images'
    const ext = String(file.originalFilename || '').split('.').pop() || 'bin'
    const path = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const buffer = fs.readFileSync(file.filepath)
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType: file.mimetype || 'application/octet-stream', upsert: false })

    if (error) return res.status(500).json({ error: 'upload_failed', message: error.message })

    // Try public URL first
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(data.path)
    if (pub?.publicUrl) {
      await auditAction(req, ok, 'upload_image', 'storage', null, null, { bucket, path: data.path })
      return res.status(200).json({ path: data.path, url: pub.publicUrl })
    }

    // If bucket is private, create a signed URL (7 days)
    const { data: signed, error: signErr } = await supabase.storage
      .from(bucket)
      .createSignedUrl(data.path, 60 * 60 * 24 * 7)

    if (!signErr && signed?.signedUrl) {
      await auditAction(req, ok, 'upload_image', 'storage', null, null, { bucket, path: data.path })
      return res.status(200).json({ path: data.path, url: signed.signedUrl })
    }

    // Fallback to returning just the path
    await auditAction(req, ok, 'upload_image', 'storage', null, null, { bucket, path: data.path })
    return res.status(200).json({ path: data.path, url: null })
  } catch (e) {
    return res.status(500).json({ error: 'upload_failed', message: e?.message })
  }
}
