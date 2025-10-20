import { useEffect, useState } from 'react'
import ModernLayout from '../components/ModernLayout'
import { useRouter } from 'next/router'

const bucketOptions = (serviceBucket) => [
  { value: 'banners', label: 'Banners' },
  { value: serviceBucket, label: 'Service Images' }
]

const formatBytes = (bytes) => {
  if (!bytes || Number(bytes) <= 0) return '—'
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`
}

const formatDate = (value) => {
  if (!value) return '—'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString('en-IN')
  } catch {
    return '—'
  }
}

export default function MediaGalleryPage({ user }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [bucket, setBucket] = useState('banners')
  const [serviceBucket] = useState(process.env.NEXT_PUBLIC_SERVICE_BUCKET || 'service-images')
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [prefix, setPrefix] = useState('')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('grid')

  useEffect(() => {
    fetchItems(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket, page])

  const fetchItems = async (reset = false) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ bucket, page: String(page), limit: '50' })
      if (prefix) params.set('prefix', prefix)
      const res = await fetch(`/api/admin/storage/list?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || json?.error || 'failed')
      setItems(json.items || [])
      setHasMore(Boolean(json.hasMore))
    } catch (e) {
      setError(e?.message || 'Failed to load media')
      setItems([])
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    return item.name?.toLowerCase().includes(q) || item.fullPath?.toLowerCase().includes(q)
  })

  const openInNewTab = (url) => {
    if (!url) return alert('No public URL for this file')
    window.open(url, '_blank')
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard')
    } catch {
      alert('Failed to copy')
    }
  }

  return (
    <ModernLayout user={user}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Media Gallery</h1>
            <p className="text-gray-600 mt-1">Browse files stored in Supabase buckets</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Bucket</label>
              <select
                value={bucket}
                onChange={(e) => { setBucket(e.target.value); setPage(1); fetchItems(true) }}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                {bucketOptions(serviceBucket).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Folder (prefix)</label>
              <input
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g. products"
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by name"
                className="border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">View</label>
              <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2">
                <option value="grid">Grid</option>
                <option value="table">Table</option>
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setPage(1); fetchItems(true) }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button
              onClick={() => { setPrefix(''); setSearch(''); setPage(1); fetchItems(true) }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              disabled={loading}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-lg">{error}</div>
        ) : null}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          {loading ? (
            <div className="py-20 text-center text-gray-500">Loading media...</div>
          ) : filteredItems.length === 0 ? (
            <div className="py-20 text-center text-gray-500">No files found</div>
          ) : viewMode === 'grid' ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <div key={item.fullPath} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                    {item.publicUrl ? (
                      item.mimeType?.startsWith('video') ? (
                        <video src={item.publicUrl} className="h-full w-full object-cover" muted playsInline controls={false} />
                      ) : (
                        <img src={item.publicUrl} alt={item.name} className="h-full w-full object-cover" />
                      )
                    ) : (
                      <span className="text-xs text-gray-400">No preview</span>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="text-sm font-semibold text-gray-900 truncate" title={item.name}>{item.name}</div>
                    <div className="text-xs text-gray-500 truncate" title={item.fullPath}>{item.fullPath}</div>
                    <div className="text-xs text-gray-500 flex justify-between">
                      <span>{formatBytes(item.size)}</span>
                      <span>{formatDate(item.lastModified)}</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <button
                        onClick={() => openInNewTab(item.publicUrl)}
                        className="flex-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        View
                      </button>
                      <button
                        onClick={() => copyToClipboard(item.publicUrl || item.fullPath)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Preview</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Path</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Size</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Updated</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map((item) => (
                    <tr key={item.fullPath}>
                      <td className="px-4 py-2">
                        {item.publicUrl ? (
                          item.mimeType?.startsWith('video') ? (
                            <video src={item.publicUrl} className="h-16 w-24 object-cover rounded" muted playsInline />
                          ) : (
                            <img src={item.publicUrl} alt={item.name} className="h-16 w-24 object-cover rounded" />
                          )
                        ) : (
                          <span className="text-xs text-gray-400">No preview</span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-medium text-gray-900 truncate" title={item.name}>{item.name}</td>
                      <td className="px-4 py-2 text-gray-500 truncate" title={item.fullPath}>{item.fullPath}</td>
                      <td className="px-4 py-2 text-gray-500">{formatBytes(item.size)}</td>
                      <td className="px-4 py-2 text-gray-500">{formatDate(item.lastModified)}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openInNewTab(item.publicUrl)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            View
                          </button>
                          <button
                            onClick={() => copyToClipboard(item.publicUrl || item.fullPath)}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            Copy
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => { setPage((p) => Math.max(1, p - 1)) }}
            disabled={page === 1 || loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <button
            onClick={() => { if (hasMore) setPage((p) => p + 1) }}
            disabled={!hasMore || loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </ModernLayout>
  )
}
