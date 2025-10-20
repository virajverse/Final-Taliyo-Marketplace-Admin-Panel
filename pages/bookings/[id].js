import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'

const TIMELINE_STEPS = [
  { step: 1, key: 'requested', label: 'Requested' },
  { step: 2, key: 'details_confirmed', label: 'Details Confirmed' },
  { step: 3, key: 'quoted', label: 'Quoted' },
  { step: 4, key: 'advance_paid', label: 'Advance Paid' },
  { step: 5, key: 'work_started', label: 'Work Started' },
  { step: 6, key: 'in_review', label: 'In Review' },
  { step: 7, key: 'delivered', label: 'Delivered' },
]

const STATUS_OPTIONS = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled']

export default function AdminBookingStatusPage() {
  const router = useRouter()
  const { id } = router.query
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [booking, setBooking] = useState(null)
  const [statusDraft, setStatusDraft] = useState('pending')
  const [timelineNote, setTimelineNote] = useState('')

  const getCsrf = () => {
    try { return document.cookie.split('; ').find(x => x.startsWith('csrf_token='))?.split('=')[1] || '' } catch { return '' }
  }

  const timeline = useMemo(() => {
    try {
      const an = booking?.additional_notes ? JSON.parse(booking.additional_notes) : {}
      return Array.isArray(an?.timeline) ? an.timeline : []
    } catch {
      return []
    }
  }, [booking?.additional_notes])

  const currentTimelineStep = useMemo(() => {
    if (!timeline.length) return 0
    const last = timeline[timeline.length - 1]
    return Number(last?.step) || 0
  }, [timeline])

  const load = async () => {
    if (!id) return
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/bookings/${id}`)
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || 'failed')
      setBooking(body.data)
      setStatusDraft(body.data?.status || 'pending')
    } catch (e) {
      console.error('load_failed', e)
      setBooking(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const updateStatus = async () => {
    if (!id) return
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrf() },
        body: JSON.stringify({ status: statusDraft })
      })
      const body = await res.json()
      if (res.status === 401) { window.location.href = '/login?error=unauthorized'; return }
      if (!res.ok) throw new Error(body?.error || 'failed')
      setBooking(body.data)
    } catch (e) {
      alert('Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  const appendTimeline = async (stepObj) => {
    if (!id) return
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrf() },
        body: JSON.stringify({
          timelineStep: stepObj.step,
          timelineLabel: stepObj.label,
          timelineNote,
          // Optionally map status when step implies
          status:
            stepObj.step >= 7 ? 'completed' :
            stepObj.step >= 5 ? 'in-progress' :
            stepObj.step >= 3 ? 'confirmed' : undefined
        })
      })
      const body = await res.json()
      if (res.status === 401) { window.location.href = '/login?error=unauthorized'; return }
      if (!res.ok) throw new Error(body?.error || 'failed')
      setBooking(body.data)
      setStatusDraft(body.data?.status || statusDraft)
      setTimelineNote('')
    } catch (e) {
      alert('Failed to append timeline')
    } finally {
      setSaving(false)
    }
  }

  if (!id) return null

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin: Order Status</h1>
          <p className="text-sm text-gray-600">ID: {id}</p>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6">Loading...</div>
        ) : !booking ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6">Not found</div>
        ) : (
          <div className="space-y-6">
            {/* Overview */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-600">Service:</span> <span className="font-medium">{booking.service_title || '-'}</span></div>
                <div><span className="text-gray-600">Provider:</span> <span className="font-medium">{booking.provider_name || '-'}</span></div>
                <div><span className="text-gray-600">Status:</span> <span className="font-medium">{booking.status}</span></div>
                <div><span className="text-gray-600">Created:</span> <span className="font-medium">{booking.created_at ? new Date(booking.created_at).toLocaleString() : '-'}</span></div>
              </div>
            </div>

            {/* Status Update */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Update Status</h2>
              <div className="flex items-center gap-3">
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2"
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value)}
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button
                  onClick={updateStatus}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-60"
                >Save</button>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Timeline</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {TIMELINE_STEPS.map(st => (
                  <button
                    key={st.step}
                    onClick={() => appendTimeline(st)}
                    disabled={saving}
                    className={`px-3 py-2 rounded-lg border ${currentTimelineStep >= st.step ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                  >
                    {st.step}. {st.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Optional note"
                  value={timelineNote}
                  onChange={(e) => setTimelineNote(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                />
                <button
                  onClick={() => appendTimeline(TIMELINE_STEPS[Math.min(TIMELINE_STEPS.length - 1, currentTimelineStep)])}
                  disabled={saving || !currentTimelineStep}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-60"
                >Add note to current</button>
              </div>

              {timeline.length > 0 && (
                <div className="mt-4 space-y-2 text-sm">
                  {timeline.map((t, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div><span className="font-medium">Step {t.step}:</span> {t.label} {t.note ? `— ${t.note}` : ''}</div>
                      <div className="text-xs text-gray-500">{new Date(t.at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
