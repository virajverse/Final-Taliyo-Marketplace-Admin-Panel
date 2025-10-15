import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '../_auth'
import formidable from 'formidable'
import * as XLSX from 'xlsx'
import AdmZip from 'adm-zip'
import { rateLimit } from '../_rateLimit'
import { auditAction } from '../_audit'

export const config = {
  api: { bodyParser: false }
}

const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('missing_env')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

const toBool = (v) => {
  if (typeof v === 'boolean') return v
  const s = String(v || '').trim().toLowerCase()
  if (!s) return false
  return s === 'true' || s === 'yes' || s === '1' || s === 'y'
}

const toNum = (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const toInt = (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : null
}

const norm = (obj = {}) => {
  const out = {}
  for (const k of Object.keys(obj)) {
    out[String(k).trim().toLowerCase()] = obj[k]
  }
  return out
}

const imageExts = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])
const extToMime = (ext) => {
  const e = String(ext || '').toLowerCase()
  if (e === 'jpg' || e === 'jpeg') return 'image/jpeg'
  if (e === 'png') return 'image/png'
  if (e === 'gif') return 'image/gif'
  if (e === 'webp') return 'image/webp'
  return 'application/octet-stream'
}

export default async function handler(req, res) {
  const ok = requireAdmin(req, res)
  if (!ok) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  try {
    if (!rateLimit(req, res, 'admin_bulk_upload', 5, 60 * 1000)) return
    const form = formidable({ multiples: true, maxFileSize: 25 * 1024 * 1024 })
    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        else resolve({ fields, files })
      })
    })

    const file = Array.isArray(files?.file) ? files.file[0] : files.file
    if (!file) return res.status(400).json({ error: 'missing_file' })

    const ext = String(file.originalFilename || file.newFilename || '')
      .split('.')
      .pop()
      ?.toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext)) return res.status(400).json({ error: 'unsupported_type' })

    const buffer = fs.readFileSync(file.filepath)
    const wb = XLSX.read(buffer, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    if (!ws) return res.status(400).json({ error: 'no_sheet' })
    const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' })

    const totalRows = rawRows.length
    if (totalRows === 0) return res.status(400).json({ error: 'empty_file' })

    const supabase = getAdminClient()
    const bucket = process.env.SERVICE_IMAGES_BUCKET || 'service-images'

    const assetsFile = Array.isArray(files?.assets) ? files.assets[0] : files.assets
    let zipMap = null
    let uploadedCache = new Map()
    if (assetsFile && String(assetsFile.originalFilename || assetsFile.newFilename || '').toLowerCase().endsWith('.zip')) {
      const zipBuf = fs.readFileSync(assetsFile.filepath)
      const zip = new AdmZip(zipBuf)
      zipMap = new Map()
      for (const entry of zip.getEntries()) {
        if (entry.isDirectory) continue
        const name = String(entry.entryName || '').split('/').pop()
        const lower = String(name || '').trim().toLowerCase()
        const e = lower.split('.').pop()
        if (imageExts.has(e)) {
          zipMap.set(lower, entry)
        }
      }
      var uploadFromZip = async (refName) => {
        try {
          const base = String(refName || '').split('/').pop().trim().toLowerCase()
          if (!base) return null
          if (!zipMap || !zipMap.has(base)) return null
          if (uploadedCache.has(base)) return uploadedCache.get(base)
          const entry = zipMap.get(base)
          const data = entry.getData()
          const ext = base.split('.').pop()
          const path = `products/bulk/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
          const { data: up, error: upErr } = await supabase.storage
            .from(bucket)
            .upload(path, data, { contentType: extToMime(ext), upsert: false })
          if (upErr) return null
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(up.path)
          if (pub?.publicUrl) {
            uploadedCache.set(base, pub.publicUrl)
            return pub.publicUrl
          }
          const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(up.path, 60 * 60 * 24 * 7)
          if (signed?.signedUrl) {
            uploadedCache.set(base, signed.signedUrl)
            return signed.signedUrl
          }
          return null
        } catch {
          return null
        }
      }
    }

    const { data: cats } = await supabase.from('categories').select('id,name,slug')
    const { data: subs } = await supabase.from('subcategories').select('id,name,slug,category_id')

    const catByName = new Map()
    const catBySlug = new Map()
    for (const c of cats || []) {
      catByName.set(String(c.name || '').trim().toLowerCase(), c.id)
      catBySlug.set(String(c.slug || '').trim().toLowerCase(), c.id)
    }
    const subByKey = new Map()
    for (const s of subs || []) {
      const key1 = `${String(s.name || '').trim().toLowerCase()}|${s.category_id || ''}`
      const key2 = `${String(s.slug || '').trim().toLowerCase()}|${s.category_id || ''}`
      subByKey.set(key1, s.id)
      subByKey.set(key2, s.id)
    }

    const payloads = []
    const errors = []

    for (let i = 0; i < rawRows.length; i++) {
      const row = norm(rawRows[i])
      const title = String(row.title || '').trim()
      if (!title) {
        errors.push({ row: i + 2, message: 'missing_title' })
        continue
      }

      const price_min = toNum(row.price_min)
      const price_max = toNum(row.price_max)
      const price_type = String(row.price_type || 'fixed').trim()
      const provider_name = row.provider_name ? String(row.provider_name).trim() : null
      const location = row.location ? String(row.location).trim() : null
      const is_remote = toBool(row.is_remote)
      const duration_minutes = toInt(row.duration_minutes)
      const description = row.description ? String(row.description) : null
      const is_active = row.is_active === '' ? true : toBool(row.is_active)

      let images = []
      if (row.images) {
        const refs = String(row.images)
          .split(',')
          .map(s => String(s).trim())
          .filter(Boolean)
        for (const ref of refs) {
          if (images.length >= 6) break
          const lower = ref.toLowerCase()
          if (lower.startsWith('http://') || lower.startsWith('https://')) {
            images.push(ref)
          } else if (zipMap) {
            const url = await uploadFromZip(ref)
            if (url) images.push(url)
          }
        }
      }

      let category_id = null
      let subcategory_id = null
      if (row.category) {
        const cv = String(row.category).trim().toLowerCase()
        category_id = catByName.get(cv) || catBySlug.get(cv) || null
      }
      if (row.subcategory && category_id) {
        const sv = String(row.subcategory).trim().toLowerCase()
        subcategory_id = subByKey.get(`${sv}|${category_id}`) || null
      }

      const payload = {
        title,
        description,
        category_id,
        subcategory_id,
        price_min,
        price_max,
        price_type,
        duration_minutes,
        location,
        is_remote,
        images: JSON.stringify(images),
        provider_name,
        is_active,
        created_at: new Date().toISOString()
      }
      payloads.push(payload)
    }

    let created = 0
    const BATCH = 100

    for (let i = 0; i < payloads.length; i += BATCH) {
      const batch = payloads.slice(i, i + BATCH)
      const { data, error } = await supabase.from('services').insert(batch).select()
      if (!error) {
        created += data?.length || 0
        continue
      }
      for (let j = 0; j < batch.length; j++) {
        const one = batch[j]
        const { data: d2, error: e2 } = await supabase.from('services').insert([one]).select()
        if (e2) {
          errors.push({ row: i + j + 2, message: e2.message })
        } else {
          created += d2?.length || 0
        }
      }
    }

    await auditAction(req, ok, 'bulk_upload', 'services', null, null, { totalRows, created, errors: errors.length })
    return res.status(200).json({ totalRows, created, errors })
  } catch (e) {
    return res.status(500).json({ error: 'bulk_upload_failed', message: e?.message })
  }
}
