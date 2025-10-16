import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

export default function RecentCartBookings() {
  const [q, setQ] = useState('')
  const [days, setDays] = useState('7')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState({ bookings: [], count: 0, days: 7 })

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`/api/admin/bookings/recent?days=${encodeURIComponent(days)}&q=${encodeURIComponent(q)}&limit=500`)
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || 'failed')
      setData(body)
    } catch (e) {
      setError(e?.message || 'failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const rows = useMemo(() => data.bookings || [], [data])

  const parseItemsCount = (row) => {
    try {
      const cart = JSON.parse(row.cart_items || '[]')
      return Array.isArray(cart) ? cart.length : 1
    } catch {
      return 1
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recent Cart Bookings</h1>
            <p className="text-sm text-gray-600">Last {data.days} day(s) • {data.count} bookings</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name / email / phone"
              className="border border-gray-300 rounded-lg px-3 py-2 w-64"
            />
            <select value={days} onChange={(e) => setDays(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2">
              <option value="1">1 day</option>
              <option value="3">3 days</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </select>
            <button onClick={load} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Apply</button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 mb-4">{error}</div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-600">No bookings</div>
        ) : (
          <>
            {/* Desktop/Tablet table */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left p-3">Created</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left p-3">Contact</th>
                    <th className="text-left p-3">Items</th>
                    <th className="text-left p-3">Price</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                      <td className="p-3 capitalize">{r.status}</td>
                      <td className="p-3">
                        <div className="font-medium">{r.customer_name || r.full_name || '-'}</div>
                        <div className="text-xs text-gray-500">{r.service_title || 'Cart Order'}</div>
                      </td>
                      <td className="p-3">
                        <div>{r.customer_email || r.email || '-'}</div>
                        <div className="text-xs text-gray-500">{r.customer_phone || r.phone || '-'}</div>
                      </td>
                      <td className="p-3">{parseItemsCount(r)}</td>
                      <td className="p-3">{r.service_price || '-'}</td>
                      <td className="p-3">
                        <Link href={`/bookings/${r.id}`} className="text-blue-600 hover:underline">Open</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden bg-white rounded-xl border border-gray-200 divide-y">
              {rows.map((r) => (
                <div key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{r.customer_name || r.full_name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500 truncate">{r.service_title || 'Cart Order'}</div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                      r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      r.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      r.status === 'in-progress' ? 'bg-purple-100 text-purple-800' :
                      r.status === 'completed' ? 'bg-green-100 text-green-800' :
                      r.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>{r.status}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    <div className="truncate">{r.customer_email || r.email || '-'}</div>
                    <div className="text-gray-500">{r.customer_phone || r.phone || '-'}</div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div className="text-gray-700 flex items-center gap-3">
                      <span>{new Date(r.created_at).toLocaleString()}</span>
                      <span>• {parseItemsCount(r)} items</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{r.service_price || '-'}</span>
                      <Link href={`/bookings/${r.id}`} className="text-blue-600 hover:underline">Open</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
