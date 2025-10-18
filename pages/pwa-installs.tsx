import { useEffect, useState } from 'react'

const APP_API = 'https://app.taliyotechnologies.com/api/pwa-installs/stats'

type Stats = {
  devices_total: number
  devices_last_30d: number
  installs_total: number
  installs_last_30d: number
  since_utc: string
}

export default function PWAInstallsPage() {
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
    <main style={{ maxWidth: 960, margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ margin: 0, marginBottom: 16, fontWeight: 800 }}>PWA Installs</h1>
      <p style={{ marginTop: 0, color: '#6b7280' }}>Unique devices and install events (from the live app).</p>

      {loading && <div>Loading…</div>}
      {err && <div style={{ color: 'crimson' }}>{err}</div>}

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <Card title="Unique Devices" subtitle={`Last 30d: ${stats.devices_last_30d}`} value={stats.devices_total} />
          <Card title="Appinstalled Events" subtitle={`Last 30d: ${stats.installs_last_30d}`} value={stats.installs_total} />
        </div>
      )}
    </main>
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
