import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from './_auth'
import { rateLimit } from './_rateLimit'

const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('missing_env')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function startOfDay(d){ const x=new Date(d); x.setHours(0,0,0,0); return x }
function endOfDay(d){ const x=new Date(d); x.setHours(23,59,59,999); return x }
function fmtDate(d){ return d.toLocaleDateString('en-IN',{ month:'short', day:'numeric' }) }

export default async function handler(req, res) {
  const ok = requireAdmin(req, res)
  if (!ok) return

  try {
    const qDays = parseInt(req.query.days || '14', 10)
    const days = Math.max(1, Math.min(365, isNaN(qDays) ? 14 : qDays))
    const from = req.query.from ? startOfDay(new Date(req.query.from)) : null
    const to = req.query.to ? endOfDay(new Date(req.query.to)) : null

    if (!rateLimit(req, res, 'admin_banner_events_read', 300, 60 * 1000)) return

    const supabase = getAdminClient()

    const since = (from || startOfDay(new Date(Date.now() - (days-1)*24*60*60*1000))).toISOString()

    // Fetch events
    let query = supabase
      .from('banner_events')
      .select('banner_id,event_type,created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: true })
    if (to) query = query.lte('created_at', to.toISOString())
    const { data: events, error } = await query

    if (error) throw error

    const ids = Array.from(new Set((events || []).map(e => e.banner_id).filter(Boolean)))
    let banners = []
    if (ids.length) {
      const { data: rows } = await supabase
        .from('banners')
        .select('id,image_url,video_url,cta_text,cta_url,cta_align')
        .in('id', ids)
      banners = rows || []
    }
    const byId = new Map(banners.map(b => [b.id, b]))

    // Aggregations
    const totals = { impressions: 0, clicks: 0 }
    const perBanner = new Map() // id -> { id, impressions, clicks }

    const dayBuckets = []
    if (from && to) {
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        dayBuckets.push(new Date(d))
      }
    } else {
      for (let i = days - 1; i >= 0; i--) {
        const d = startOfDay(new Date(Date.now() - i*24*60*60*1000))
        dayBuckets.push(d)
      }
    }
    const timeline = new Map(dayBuckets.map(d => [d.toDateString(), { date: fmtDate(d), impressions: 0, clicks: 0 }]))

    for (const e of events || []) {
      const key = (e.event_type === 'click') ? 'clicks' : 'impressions'
      totals[key] += 1

      const curr = perBanner.get(e.banner_id) || { id: e.banner_id, impressions: 0, clicks: 0 }
      curr[key] += 1
      perBanner.set(e.banner_id, curr)

      const dayKey = startOfDay(new Date(e.created_at)).toDateString()
      if (timeline.has(dayKey)) {
        const t = timeline.get(dayKey)
        t[key] += 1
      }
    }

    const list = Array.from(perBanner.values())
      .map((r) => {
        const meta = byId.get(r.id) || {}
        const clicks = r.clicks || 0
        const imps = r.impressions || 0
        const ctr = imps ? Number(((clicks / imps) * 100).toFixed(2)) : 0
        return {
          id: r.id,
          impressions: imps,
          clicks,
          ctr,
          image_url: meta.image_url || null,
          video_url: meta.video_url || null,
          cta_text: meta.cta_text || null,
          cta_url: meta.cta_url || null,
          cta_align: meta.cta_align || 'center',
        }
      })
      .sort((a,b) => b.clicks - a.clicks)

    const out = {
      totals: {
        impressions: totals.impressions,
        clicks: totals.clicks,
        ctr: totals.impressions ? Number(((totals.clicks / totals.impressions) * 100).toFixed(2)) : 0,
      },
      perBanner: list,
      timeline: Array.from(timeline.values())
    }

    return res.status(200).json({ data: out })
  } catch (e) {
    return res.status(500).json({ error: 'banner_events_failed', message: e?.message })
  }
}
