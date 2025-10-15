import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from './_auth'
import { rateLimit } from './_rateLimit'

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
    const supabase = getAdminClient()

    const days = parseInt(req.query.dateRange || '7', 10)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (Number.isNaN(days) ? 7 : days))

    if (!rateLimit(req, res, 'admin_tracking_read', 300, 60 * 1000)) return

    const { data: clicks, error } = await supabase
      .from('order_clicks')
      .select(`
        *,
        items (
          id,
          title,
          type,
          category,
          whatsapp_link
        ),
        services (
          id,
          title
        )
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    return res.status(200).json({ data: clicks || [] })
  } catch (e) {
    return res.status(500).json({ error: 'tracking_failed', message: e?.message })
  }
}
