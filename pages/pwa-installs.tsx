import { useEffect, useState } from 'react'
import ModernLayout from '../components/ModernLayout'

const APP_BASE = 'https://app.taliyotechnologies.com'
const API_STATS = APP_BASE + '/api/pwa-installs/stats'
const API_BREAKDOWN = APP_BASE + '/api/pwa-installs/breakdown'
const API_SERIES = APP_BASE + '/api/pwa-installs/series'
const API_FUNNEL = APP_BASE + '/api/pwa-installs/funnel'
const API_LATEST = APP_BASE + '/api/pwa-installs/latest'
const API_FUNNEL_PLATFORM = APP_BASE + '/api/pwa-installs/funnel-platform'
const API_SOURCES = APP_BASE + '/api/pwa-installs/sources'
const API_USERS = APP_BASE + '/api/pwa-installs/users'

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
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [range, setRange] = useState<'7d'|'30d'|'90d'>('30d')

  const [breakdown, setBreakdown] = useState<{ platform: Record<string, number>, browser: Record<string, number> } | null>(null)
  const [funnel, setFunnel] = useState<{ steps: { impressions: number, prompted: number, accepted: number, first_open: number } } | null>(null)
  const [latest, setLatest] = useState<Array<{ device_id: string, ua: string, platform: string, lang: string, created_at: string }>>([])
  const [series, setSeries] = useState<{ labels: string[], first_open: number[], appinstalled: number[] } | null>(null)
  const [platformFunnel, setPlatformFunnel] = useState<{ by_platform: Record<string, { impressions: number, prompted: number, accepted: number, first_open: number }> } | null>(null)
  const [sources, setSources] = useState<Array<{ label: string, devices: number, installs: number, conversion: number }>>([])
  const [usersInstalled, setUsersInstalled] = useState<Array<{ id: string, name: string | null, phone: string | null, avatar_url: string | null, email: string | null, first_open_at: string }>>([])
  const [usersNotInstalled, setUsersNotInstalled] = useState<Array<{ id: string, name: string | null, phone: string | null, avatar_url: string | null, created_at: string }>>([])

  useEffect(() => {
    let on = true
    ;(async () => {
      try {
        const res = await fetch(API_STATS, { credentials: 'omit' })
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

  // derive from/to from chosen range
  useEffect(() => {
    const now = new Date()
    const end = now.toISOString()
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString()
    setFrom(start)
    setTo(end)
  }, [range])

  // fetch breakdown, funnel, latest for window
  useEffect(() => {
    if (!from || !to) return
    let alive = true
    const q = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    ;(async () => {
      try {
        const [bd, fn, lt, sr, fp, sc, us] = await Promise.all([
          fetch(API_BREAKDOWN + q).then(r => r.json()),
          fetch(API_FUNNEL + q).then(r => r.json()),
          fetch(API_LATEST + q + '&limit=20').then(r => r.json()),
          fetch(API_SERIES + q).then(r => r.json()),
          fetch(API_FUNNEL_PLATFORM + q).then(r => r.json()),
          fetch(API_SOURCES + q).then(r => r.json()),
          fetch(API_USERS + q).then(r => r.json()),
        ])
        if (!alive) return
        if (bd?.error) throw new Error(bd.error)
        if (fn?.error) throw new Error(fn.error)
        if (lt?.error) throw new Error(lt.error)
        if (sr?.error) throw new Error(sr.error)
        if (fp?.error) throw new Error(fp.error)
        if (sc?.error) throw new Error(sc.error)
        if (us?.error) throw new Error(us.error)
        setBreakdown({ platform: bd.platform || {}, browser: bd.browser || {} })
        setFunnel(fn)
        setLatest(lt.rows || [])
        setSeries({ labels: sr.labels || [], first_open: sr.first_open || [], appinstalled: sr.appinstalled || [] })
        setPlatformFunnel({ by_platform: fp.by_platform || {} })
        setSources(sc.rows || [])
        setUsersInstalled(Array.isArray(us.installed) ? us.installed : [])
        setUsersNotInstalled(Array.isArray(us.not_installed) ? us.not_installed : [])
      } catch (e: any) {
        setErr(e?.message || 'Failed to load breakdown')
      }
    })()
    return () => { alive = false }
  }, [from, to])

  return (
    <ModernLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">PWA Installs</h1>
          <p className="text-gray-600 mt-1">Unique devices and install events (from the live app).</p>
        </div>

        {/* Range filter */}
        <div className="flex items-center gap-2">
          <button className={`px-3 py-1.5 rounded-lg border ${range==='7d'?'bg-blue-600 text-white border-blue-600':'border-gray-200'}`} onClick={()=>setRange('7d')}>Last 7d</button>
          <button className={`px-3 py-1.5 rounded-lg border ${range==='30d'?'bg-blue-600 text-white border-blue-600':'border-gray-200'}`} onClick={()=>setRange('30d')}>Last 30d</button>
          <button className={`px-3 py-1.5 rounded-lg border ${range==='90d'?'bg-blue-600 text-white border-blue-600':'border-gray-200'}`} onClick={()=>setRange('90d')}>Last 90d</button>
          <div className="text-sm text-gray-500 ml-2">{from && to ? `${new Date(from).toLocaleDateString()} – ${new Date(to).toLocaleDateString()}` : ''}</div>
        </div>

        {loading && <div className="text-gray-600">Loading…</div>}
        {err && <div className="text-red-600">{err}</div>}

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card title="Unique Devices" subtitle={`Last 30d: ${stats.devices_last_30d}`} value={stats.devices_total} />
            <Card title="Appinstalled Events" subtitle={`Last 30d: ${stats.installs_last_30d}`} value={stats.installs_total} />
          </div>
        )}

        {/* Daily trend */}
        {series && series.labels?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-lg font-semibold mb-3">Daily Trend</h3>
            <MiniLine labels={series.labels} a={series.first_open} b={series.appinstalled} aLabel="First Open" bLabel="Appinstalled" />
          </div>
        )}

        {/* Platform breakdown */}
        {breakdown && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-lg font-semibold mb-3">Platform Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {Object.entries(breakdown.platform).map(([k,v]) => (
                <div key={k} className="rounded-lg border border-gray-200 p-3">
                  <div className="text-xs text-gray-500 capitalize">{k}</div>
                  <div className="text-xl font-bold">{v}</div>
                </div>
              ))}
            </div>
            <h4 className="text-sm font-medium mt-4 mb-2 text-gray-700">Browser</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {Object.entries(breakdown.browser).map(([k,v]) => (
                <div key={k} className="rounded-lg border border-gray-200 p-3">
                  <div className="text-xs text-gray-500 capitalize">{k}</div>
                  <div className="text-xl font-bold">{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Funnel */}
        {funnel && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-lg font-semibold mb-3">Install Funnel</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {label: 'Impressions', value: funnel.steps.impressions},
                {label: 'Prompted', value: funnel.steps.prompted},
                {label: 'Accepted', value: funnel.steps.accepted},
                {label: 'First Open', value: funnel.steps.first_open},
              ].map(s => (
                <div key={s.label} className="rounded-lg border border-gray-200 p-3">
                  <div className="text-xs text-gray-500">{s.label}</div>
                  <div className="text-xl font-bold">{s.value}</div>
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-600 mt-3">
              Conversion (Prompt → Accepted): {funnel.steps.prompted ? Math.round((funnel.steps.accepted / funnel.steps.prompted) * 100) : 0}%
              <span className="ml-3">(Accepted → First Open): {funnel.steps.accepted ? Math.round((funnel.steps.first_open / funnel.steps.accepted) * 100) : 0}%</span>
            </div>
          </div>
        )}

        {/* Platform conversion */}
        {platformFunnel && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-lg font-semibold mb-3">Conversion by Platform</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(platformFunnel.by_platform).map(([plat, v]) => (
                <div key={plat} className="rounded-lg border border-gray-200 p-3">
                  <div className="text-sm font-medium text-gray-800 capitalize mb-1">{plat}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>Impressions</div><div className="text-right font-semibold text-gray-900">{v.impressions}</div>
                    <div>Prompted</div><div className="text-right font-semibold text-gray-900">{v.prompted}</div>
                    <div>Accepted</div><div className="text-right font-semibold text-gray-900">{v.accepted}</div>
                    <div>First Open</div><div className="text-right font-semibold text-gray-900">{v.first_open}</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Prompt → Accepted: {v.prompted ? Math.round((v.accepted / v.prompted) * 100) : 0}% | Accepted → First: {v.accepted ? Math.round((v.first_open / v.accepted) * 100) : 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Latest installs */}
        {latest?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Latest Installs</h3>
              <div className="text-sm text-gray-500">Showing {latest.length}</div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2">Device</th>
                    <th className="px-3 py-2">Platform</th>
                    <th className="px-3 py-2">Lang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {latest.map((r, idx) => (
                    <tr key={idx} className="text-sm">
                      <td className="px-3 py-2 text-gray-600">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="px-3 py-2 truncate max-w-[320px] text-gray-800">{(r.ua || '').slice(0,120)}</td>
                      <td className="px-3 py-2 text-gray-600">{r.platform || '-'}</td>
                      <td className="px-3 py-2 text-gray-600">{r.lang || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top sources */}
        {sources?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-lg font-semibold mb-3">Top Sources (UTM/Referrer)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="px-3 py-2">Source</th>
                    <th className="px-3 py-2">Devices</th>
                    <th className="px-3 py-2">Installs</th>
                    <th className="px-3 py-2">Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sources.map((s, idx) => (
                    <tr key={idx} className="text-sm">
                      <td className="px-3 py-2 text-gray-800">{s.label}</td>
                      <td className="px-3 py-2 text-gray-600">{s.devices}</td>
                      <td className="px-3 py-2 text-gray-600">{s.installs}</td>
                      <td className="px-3 py-2 text-gray-600">{s.conversion}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User-level mapping */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Users by Install Status</h3>
            <div className="text-sm text-gray-500">
              Installed: {usersInstalled.length} · Not Installed: {usersNotInstalled.length}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-700">Installed (First Open)</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500">
                      <th className="px-3 py-2">User</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2">First Open</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {usersInstalled.slice(0, 20).map((u, idx) => (
                      <tr key={idx} className="text-sm">
                        <td className="px-3 py-2 text-gray-800">{u.name || u.id.slice(0,8)}</td>
                        <td className="px-3 py-2 text-gray-600">{u.email || '-'}</td>
                        <td className="px-3 py-2 text-gray-600">{u.phone || '-'}</td>
                        <td className="px-3 py-2 text-gray-600">{new Date(u.first_open_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {usersInstalled.length > 20 && (
                  <div className="text-xs text-gray-500 mt-2">Showing 20 of {usersInstalled.length}</div>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2 text-gray-700">Not Installed</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500">
                      <th className="px-3 py-2">User</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {usersNotInstalled.slice(0, 20).map((u, idx) => (
                      <tr key={idx} className="text-sm">
                        <td className="px-3 py-2 text-gray-800">{u.name || u.id.slice(0,8)}</td>
                        <td className="px-3 py-2 text-gray-600">{u.phone || '-'}</td>
                        <td className="px-3 py-2 text-gray-600">{new Date(u.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {usersNotInstalled.length > 20 && (
                  <div className="text-xs text-gray-500 mt-2">Showing 20 of {usersNotInstalled.length}</div>
                )}
              </div>
            </div>
          </div>
        </div>
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

function MiniLine({ labels, a, b, aLabel, bLabel }: { labels: string[]; a: number[]; b: number[]; aLabel: string; bLabel: string }) {
  const n = Math.max(a.length, b.length)
  if (!n) return null
  const width = 600
  const height = 120
  const maxVal = Math.max(1, ...a, ...b)
  const points = (arr: number[]) => arr.map((v, i) => {
    const x = n === 1 ? 0 : i * (width / (n - 1))
    const y = height - (v / maxVal) * (height - 10) - 5
    return `${x},${y}`
  }).join(' ')
  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
        <polyline fill="none" stroke="#8B5CF6" strokeWidth="2" points={points(a)} />
        <polyline fill="none" stroke="#10B981" strokeWidth="2" points={points(b)} />
      </svg>
      <div className="flex items-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded bg-purple-500"></span>{aLabel}</div>
        <div className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded bg-emerald-500"></span>{bLabel}</div>
      </div>
    </div>
  )
}
