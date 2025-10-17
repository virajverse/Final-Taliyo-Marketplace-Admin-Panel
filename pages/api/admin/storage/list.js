import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '../_auth'
import { rateLimit } from '../_rateLimit'

const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('missing_env')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

const sanitizePrefix = (value) => {
  if (!value) return ''
  const cleaned = value.toString().replace(/\\+/g, '/').replace(/^\/+|\/+$/g, '')
  return cleaned
}

const allowedBuckets = () => {
  const serviceBucket = process.env.SERVICE_IMAGES_BUCKET || 'service-images'
  return new Set(['banners', serviceBucket])
}

export default async function handler(req, res) {
  const ok = requireAdmin(req, res)
  if (!ok) return

  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' })

  if (!rateLimit(req, res, 'admin_storage_list', 120, 60 * 1000)) return

  try {
    const bucketParam = (req.query.bucket || '').toString() || 'banners'
    const buckets = allowedBuckets()
    if (!buckets.has(bucketParam)) {
      return res.status(400).json({ error: 'invalid_bucket' })
    }

    const prefix = sanitizePrefix(req.query.prefix)
    const limitParam = Number(req.query.limit)
    const pageParam = Number(req.query.page)
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(100, limitParam)) : 50
    const page = Number.isFinite(pageParam) ? Math.max(1, pageParam) : 1
    const offset = (page - 1) * limit

    const path = prefix || ''

    const supabase = getAdminClient()
    const { data, error } = await supabase.storage
      .from(bucketParam)
      .list(path, {
        limit,
        offset,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) throw error

    const files = []
    for (const item of data || []) {
      if (!item || item.name?.startsWith('.')) continue
      const isFolder = !item.id || item.id === 'folder' || item.metadata === null
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name
      let publicUrl = null
      if (!isFolder) {
        const { data: pub } = supabase.storage.from(bucketParam).getPublicUrl(fullPath)
        publicUrl = pub?.publicUrl || null
        if (!publicUrl) {
          const { data: signed } = await supabase.storage
            .from(bucketParam)
            .createSignedUrl(fullPath, 60 * 60 * 24 * 7)
          if (signed?.signedUrl) publicUrl = signed.signedUrl
        }
      }

      files.push({
        name: item.name,
        id: item.id,
        bucket: bucketParam,
        fullPath,
        size: item.metadata?.size ?? item.size ?? null,
        lastModified: item.updated_at || item.created_at || item.metadata?.lastModified || null,
        mimeType: item.metadata?.mimetype || item.metadata?.contentType || null,
        isFolder,
        publicUrl
      })
    }

    return res.status(200).json({
      ok: true,
      bucket: bucketParam,
      prefix,
      page,
      limit,
      count: files.length,
      hasMore: files.length === limit,
      items: files
    })
  } catch (e) {
    console.error('storage_list_failed', e)
    return res.status(500).json({ error: 'storage_list_failed', message: e?.message })
  }
}
