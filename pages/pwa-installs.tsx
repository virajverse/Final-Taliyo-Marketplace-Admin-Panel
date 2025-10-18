import { useEffect, useState } from 'react'
import ModernLayout from '../components/ModernLayout'

const APP_API = 'https://app.taliyotechnologies.com/api/pwa-installs/stats'

type Stats = {
  devices_total: number
  devices_last_30d: number
  installs_total: number
  installs_last_30d: number
  since_utc: string
}

export default function PWAInstallsPage({ user }: any) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let on = true
    ;(async () => {
      try {
        const res = await fetch(APP_API, { credentials: 'omit' })
        if (!res.ok) throw new Error(`Failed to load stats (${res.status})`)
        const json = (await res.json()) as Stats
        if (on) setStats(json)
      } catch (e: any) {
        if (on) setErr(e?.message || 'Error loading stats')
      } finally {
        if (on) setLoading(false)
      }
    })()
    return () => { on = false }
  }, [])

  return (
    <ModernLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">PWA Installs</h1>
          <p className="text-gray-600 mt-1">Unique devices and install events (from the live app).</p>
        </div>

        {loading && <div className="text-gray-600">Loading…</div>}
        {err && <div className="text-red-600">{err}</div>}

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card title="Unique Devices" subtitle={`Last 30d: ${stats.devices_last_30d}`} value={stats.devices_total} />
            <Card title="Appinstalled Events" subtitle={`Last 30d: ${stats.installs_last_30d}`} value={stats.installs_total} />
          </div>
        )}
      </div>
    </ModernLayout>
  )
}

function Card({ title, value, subtitle }: { title: string; value: number; subtitle?: string }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 12, color: '#6b7280' }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
      {subtitle && <div style={{ fontSize: 12, color: '#6b7280' }}>{subtitle}</div>}
    </div>
  )
}
