import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from './_auth'

const slugify = (str = '') =>
  String(str)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })
  try {
    const ok = requireAdmin(req, res)
    if (!ok) return

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return res.status(500).json({ error: 'missing_env' })

    const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

    // Load items to sync
    const { data: items, error: itemsErr } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: true })

    if (itemsErr) throw itemsErr

    const created = []
    const updated = []
    const skipped = []

    for (const it of items || []) {
      const slug = slugify(it.title)

      // Ensure category exists (match by name)
      let category_id = null
      if (it.category) {
        const catSlug = slugify(it.category)
        let { data: cat } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', catSlug)
          .maybeSingle()
        if (!cat) {
          const { data: newCat } = await supabase
            .from('categories')
            .insert([{ name: it.category, description: '', icon: '', slug: catSlug, is_active: true }])
            .select()
            .single()
          category_id = newCat?.id || null
        } else {
          category_id = cat.id
        }
      }

      const { data: existing } = await supabase
        .from('services')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      const payload = {
        title: it.title || 'Untitled',
        description: it.description || null,
        category_id,
        subcategory_id: null,
        price_min: it.price != null ? Number(it.price) : null,
        price_max: it.price != null ? Number(it.price) : null,
        price_type: 'fixed',
        duration_minutes: null,
        location: null,
        is_remote: false,
        images: '[]',
        provider_name: null,
        provider_avatar: null,
        provider_bio: null,
        provider_phone: null,
        provider_email: null,
        provider_verified: false,
        rating_average: 0,
        rating_count: 0,
        is_active: it.is_active !== false,
        is_featured: false,
        slug,
        meta_title: null,
        meta_description: null
      }

      if (existing?.id) {
        const { error: upErr } = await supabase
          .from('services')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        if (upErr) {
          skipped.push({ title: it.title, reason: upErr.message })
        } else {
          updated.push({ title: it.title })
        }
      } else {
        const { error: inErr } = await supabase
          .from('services')
          .insert([{ ...payload, created_at: new Date().toISOString() }])
        if (inErr) {
          skipped.push({ title: it.title, reason: inErr.message })
        } else {
          created.push({ title: it.title })
        }
      }
    }

    return res.status(200).json({ created: created.length, updated: updated.length, skipped })
  } catch (err) {
    return res.status(500).json({ error: 'sync_failed', message: err?.message })
  }
}
