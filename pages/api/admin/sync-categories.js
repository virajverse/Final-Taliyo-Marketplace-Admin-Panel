import { createClient } from '@supabase/supabase-js'

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
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return res.status(500).json({ error: 'missing_env' })

    const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

    // Load all existing categories into a map by slug
    const { data: existingCats } = await supabase
      .from('categories')
      .select('id,name,slug')

    const bySlug = new Map()
    const byName = new Map()
    for (const c of existingCats || []) {
      if (c.slug) bySlug.set(c.slug, c)
      if (c.name) byName.set(c.name.toLowerCase(), c)
    }

    // Pull unique category names from items.category
    const { data: items } = await supabase
      .from('items')
      .select('category')

    const unique = new Map() // slug -> name
    for (const it of items || []) {
      const name = (it.category || '').trim()
      if (!name) continue
      const slug = slugify(name)
      if (!unique.has(slug)) unique.set(slug, name)
    }

    let created = 0
    let updated = 0

    for (const [slug, name] of unique.entries()) {
      const existing = bySlug.get(slug) || byName.get(name.toLowerCase())
      if (existing) {
        // Ensure active and name up to date
        const { error } = await supabase
          .from('categories')
          .update({ name, slug, is_active: true, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        if (!error) updated++
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([{ name, description: '', icon: '', slug, is_active: true, sort_order: 0, created_at: new Date().toISOString() }])
        if (!error) created++
      }
    }

    return res.status(200).json({ created, updated, totalUnique: unique.size })
  } catch (err) {
    return res.status(500).json({ error: 'sync_failed', message: err?.message })
  }
}
