import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '../_auth'

export const config = {
  api: {
    bodyParser: false,
  },
}

const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('missing_env')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

const readRawBody = (req) => new Promise((resolve, reject) => {
  const chunks = []
  req.on('data', (c) => chunks.push(c))
  req.on('end', () => resolve(Buffer.concat(chunks)))
  req.on('error', reject)
})

export default async function handler(req, res) {
  const ok = requireAdmin(req, res)
  if (!ok) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  try {
    const filename = (req.query.filename || '').toString().trim()
    const contentType = req.headers['content-type'] || 'application/octet-stream'
    if (!filename) return res.status(400).json({ error: 'missing_filename' })

    const ext = filename.includes('.') ? filename.split('.').pop() : 'dat'
    const path = `banners/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const buffer = await readRawBody(req)
    if (!buffer?.length) return res.status(400).json({ error: 'empty_body' })

    const supabase = getAdminClient()
    const { error } = await supabase.storage
      .from('banners')
      .upload(path, buffer, { contentType, upsert: false })
    if (error) throw error

    const { data } = supabase.storage.from('banners').getPublicUrl(path)
    return res.status(200).json({ ok: true, url: data?.publicUrl || null, path })
  } catch (e) {
    return res.status(500).json({ error: 'upload_failed', message: e?.message || 'failed' })
  }
}
