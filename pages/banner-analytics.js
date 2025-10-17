import { useEffect, useMemo, useState } from 'react'
import ModernLayout from '../components/ModernLayout'
import { useRouter } from 'next/router'
import { checkSession } from '../lib/simpleAuth'
import { BarChart3, Eye, MousePointer, Download, Calendar, Filter } from 'lucide-react'

export default function BannerAnalytics() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('preset') // preset | custom
  const [days, setDays] = useState('7')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [data, setData] = useState({ totals: { impressions: 0, clicks: 0, ctr: 0 }, perBanner: [], timeline: [] })
  const [filter, setFilter] = useState('all') // all | image | video
  const [search, setSearch] = useState('')
  const [LineComp, setLineComp] = useState(null)

  useEffect(() => {
    const session = checkSession()
    if (!session) {
      router.push('/login')
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  useEffect(() => {
    if (mode === 'custom') {
      if (!fromDate || !toDate) {
        setData({ totals: { impressions: 0, clicks: 0, ctr: 0 }, perBanner: [], timeline: [] })
        setLoading(false)
        return
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, days, fromDate, toDate])

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (mode === 'custom' && fromDate && toDate) {
        params.set('from', fromDate)
        params.set('to', toDate)
      } else {
        params.set('days', days)
      }
      const res = await fetch(`/api/admin/banner-events?${params.toString()}`)
      if (res.status === 401) {
        router.push('/login?error=unauthorized')
        return
      }
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to load banner analytics')
      setData(json.data || { totals: { impressions: 0, clicks: 0, ctr: 0 }, perBanner: [], timeline: [] })
    } catch (e) {
      console.error(e)
      setData({ totals: { impressions: 0, clicks: 0, ctr: 0 }, perBanner: [], timeline: [] })
    } finally {
      setLoading(false)
    }
  }

  const filteredList = useMemo(() => {
    if (filter === 'all') return data.perBanner || []
    return (data.perBanner || []).filter((b) => {
      const isVideo = !!b.video_url
      return filter === 'video' ? isVideo : !isVideo
    })
  }, [data.perBanner, filter])

  const finalList = useMemo(() => {
    const q = (search || '').toLowerCase().trim()
    if (!q) return filteredList
    return filteredList.filter(b => 
      (b.cta_text || '').toLowerCase().includes(q) ||
      (b.cta_url || '').toLowerCase().includes(q) ||
      (b.id || '').toLowerCase().includes(q)
    )
  }, [filteredList, search])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const [{ Line }] = await Promise.all([
          import('react-chartjs-2'),
          import('chart.js/auto')
        ])
        if (!mounted) return
        setLineComp(() => Line)
      } catch (e) {
        // Chart libs not installed yet; fallback UI will be used
        setLineComp(null)
      }
    })()
    return () => { mounted = false }
  }, [])

  const exportCSV = () => {
    const rows = [
      ['Banner ID', 'CTA Text', 'Impressions', 'Clicks', 'CTR %', 'Type'],
      ...finalList.map((b) => [
        b.id,
        b.cta_text || '',
        String(b.impressions || 0),
        String(b.clicks || 0),
        String(b.ctr || 0),
        b.video_url ? 'video' : 'image',
      ])
    ]
    const csv = rows.map(r => r.map(v => typeof v === 'string' && v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `banner-analytics-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <ModernLayout user={{ email: 'admin@taliyo.com' }}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Banner Analytics</h1>
            <p className="text-gray-600 mt-1">Impressions, clicks and CTR for homepage banners</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Calendar size={16} className="text-gray-500" />
              <select value={mode} onChange={(e)=>setMode(e.target.value)} className="border rounded px-2 py-1 w-full sm:w-auto">
                <option value="preset">Presets</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            {mode === 'preset' ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select value={days} onChange={(e)=>setDays(e.target.value)} className="border rounded px-2 py-1 w-full sm:w-auto">
                  <option value="1">Last 24 hours</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(e)=>setFromDate(e.target.value)}
                  className="border rounded px-3 py-1 text-sm w-full sm:w-auto"
                />
                <span className="text-xs text-gray-500">to</span>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e)=>setToDate(e.target.value)}
                  className="border rounded px-3 py-1 text-sm w-full sm:w-auto"
                />
              </div>
            )}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={16} className="text-gray-500" />
              <select value={filter} onChange={(e)=>setFilter(e.target.value)} className="border rounded px-2 py-1 w-full sm:w-auto">
                <option value="all">All</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
              </select>
            </div>
            <input
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              placeholder="Search banners (CTA, URL, ID)"
              className="border rounded px-3 py-1 text-sm w-full sm:w-56"
            />
            <button onClick={exportCSV} className="px-3 py-2 border rounded hover:bg-gray-50 flex items-center w-full sm:w-auto justify-center">
              <Download size={16} className="mr-2" /> Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Impressions</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : (data?.totals?.impressions || 0).toLocaleString()}</div>
              </div>
              <Eye className="text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Clicks</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : (data?.totals?.clicks || 0).toLocaleString()}</div>
              </div>
              <MousePointer className="text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Overall CTR</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : `${Number(data?.totals?.ctr || 0).toFixed(2)}%`}</div>
              </div>
              <BarChart3 className="text-purple-500" />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="mb-3 text-sm font-medium text-gray-800">Timeline</div>
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : (data.timeline || []).length === 0 ? (
            <div className="text-gray-500">No data</div>
          ) : LineComp ? (
            <div className="w-full h-64">
              <LineComp
                data={{
                  labels: (data.timeline || []).map(t => t.date),
                  datasets: [
                    {
                      label: 'Impressions',
                      data: (data.timeline || []).map(t => t.impressions),
                      borderColor: 'rgba(59,130,246,1)',
                      backgroundColor: 'rgba(59,130,246,0.2)',
                      tension: 0.35,
                    },
                    {
                      label: 'Clicks',
                      data: (data.timeline || []).map(t => t.clicks),
                      borderColor: 'rgba(34,197,94,1)',
                      backgroundColor: 'rgba(34,197,94,0.2)',
                      tension: 0.35,
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { mode: 'index', intersect: false },
                  plugins: { legend: { position: 'top' } },
                  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
                }}
              />
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[560px] grid grid-cols-12 gap-3 items-end" style={{ gridAutoFlow: 'column' }}>
                {(data.timeline || []).map((t, i) => {
                  const max = Math.max(...data.timeline.map(x => Math.max(x.impressions, x.clicks))) || 1
                  const impH = Math.round((t.impressions / max) * 80) + 10
                  const clickH = Math.round((t.clicks / max) * 80) + 10
                  return (
                    <div key={i} className="flex flex-col items-center">
                      <div className="flex items-end gap-1 h-28">
                        <div className="w-3 bg-blue-400 rounded" style={{ height: impH }} title={`Impressions: ${t.impressions}`} />
                        <div className="w-3 bg-green-400 rounded" style={{ height: clickH }} title={`Clicks: ${t.clicks}`} />
                      </div>
                      <div className="text-[11px] text-gray-600 mt-1">{t.date}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 text-sm font-medium text-gray-800">Banners</div>
          {loading ? (
            <div className="p-8 text-gray-600">Loading...</div>
          ) : finalList.length === 0 ? (
            <div className="p-8 text-gray-500">No banners</div>
          ) : (
            <>
              <div className="overflow-x-auto hidden md:block">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Preview</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">CTA</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Impressions</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Clicks</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">CTR</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {finalList.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap">
                          {b.video_url ? (
                            <video src={b.video_url} className="w-40 h-16 rounded object-cover" muted playsInline />
                          ) : b.image_url ? (
                            <img src={b.image_url} className="w-40 h-16 object-cover rounded" alt="banner" />
                          ) : (
                            <span className="text-xs text-gray-400">No media</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-sm font-medium text-gray-900">{b.cta_text || '-'}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[280px]">{b.cta_url || '-'}</div>
                        </td>
                        <td className="px-4 py-2 text-sm">{b.impressions?.toLocaleString?.() || b.impressions || 0}</td>
                        <td className="px-4 py-2 text-sm">{b.clicks?.toLocaleString?.() || b.clicks || 0}</td>
                        <td className="px-4 py-2 text-sm">{typeof b.ctr === 'number' ? `${b.ctr.toFixed(2)}%` : `${Number(b.ctr||0).toFixed(2)}%`}</td>
                        <td className="px-4 py-2 text-sm">{b.video_url ? 'Video' : 'Image'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden divide-y">
                {finalList.map((b) => (
                  <div key={b.id} className="p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-28 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                        {b.video_url ? (
                          <video src={b.video_url} className="h-full w-full object-cover" muted playsInline />
                        ) : b.image_url ? (
                          <img src={b.image_url} className="h-full w-full object-cover" alt="banner" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">No media</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{b.cta_text || '-'}</div>
                        <div className="text-xs text-gray-500 truncate">{b.cta_url || '-'}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600">Impr: <span className="font-medium">{b.impressions || 0}</span></span>
                        <span className="text-gray-600">Clicks: <span className="font-medium">{b.clicks || 0}</span></span>
                      </div>
                      <span className="text-gray-900 font-semibold">{typeof b.ctr === 'number' ? `${b.ctr.toFixed(2)}%` : `${Number(b.ctr||0).toFixed(2)}%`}</span>
                    </div>
                    <div className="text-xs text-gray-500">{b.video_url ? 'Video' : 'Image'}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </ModernLayout>
  )
}
