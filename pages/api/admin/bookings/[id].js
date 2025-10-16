import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '../_auth'
import { rateLimit } from '../_rateLimit'
import { auditAction } from '../_audit'

const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('missing_env')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export default async function handler(req, res) {
  const ok = requireAdmin(req, res)
  if (!ok) return

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'missing_id' })

  try {
    const supabase = getAdminClient()

    if (req.method === 'PATCH') {
      if (!rateLimit(req, res, 'admin_bookings_write', 60, 60 * 1000)) return
      const { status, notes, timelineStep, timelineLabel, timelineNote } = req.body || {}
      const updates = {}
      if (status) updates.status = status

      // Merge timeline into additional_notes JSON string
      if (notes != null || timelineStep != null) {
        // Fetch existing additional_notes to merge
        const { data: existingRow } = await supabase
          .from('bookings')
          .select('additional_notes')
          .eq('id', id)
          .single()
        let an = {}
        try {
          if (existingRow?.additional_notes) {
            an = JSON.parse(existingRow.additional_notes)
            if (an && typeof an !== 'object') an = {}
          }
        } catch {}
        if (notes != null) {
          an.notes = String(notes)
        }
        if (timelineStep != null) {
          const entry = {
            step: Number(timelineStep),
            label: timelineLabel || String(timelineStep),
            note: timelineNote ? String(timelineNote) : undefined,
            at: new Date().toISOString()
          }
          if (!Array.isArray((an).timeline)) {
            an.timeline = []
          }
          an.timeline.push(entry)
        }
        try {
          updates.additional_notes = JSON.stringify(an)
        } catch {
          updates.additional_notes = String(notes ?? existingRow?.additional_notes ?? '')
        }
      }

      const { data, error } = await supabase
        .from('bookings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      await auditAction(req, ok, 'update', 'bookings', id, null, data)
      return res.status(200).json({ data })
    }

    if (req.method === 'GET') {
      if (!rateLimit(req, res, 'admin_bookings_read', 300, 60 * 1000)) return
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return res.status(200).json({ data })
    }

    return res.status(405).json({ error: 'method_not_allowed' })
  } catch (e) {
    return res.status(500).json({ error: 'booking_failed', message: e?.message })
  }
}
