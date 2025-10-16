import { useEffect, useMemo, useState } from 'react'

export default function AdminUserLogins() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState({ users: [], eventsCount: 0 })

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const url = `/api/admin/users/logins?q=${encodeURIComponent(query)}&limit=1000`
      const res = await fetch(url)
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

  const users = useMemo(() => data.users || [], [data])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Logins</h1>
            <p className="text-sm text-gray-600">Per-customer login activity (last {data.eventsCount} events)</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by email / phone / userId"
              className="border border-gray-300 rounded-lg px-3 py-2 w-full sm:w-72"
            />
            <button onClick={load} className="px-4 py-2 rounded-lg bg-blue-600 text-white w-full sm:w-auto">Search</button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 mb-4">{error}</div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6">Loading...</div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-600">No login events</div>
        ) : (
          <>
            {/* Desktop/Tablet table */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left p-3">User ID</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Phone</th>
                    <th className="text-left p-3">Last Login</th>
                    <th className="text-left p-3">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.userId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-mono text-xs">{u.userId}</td>
                      <td className="p-3">{u.email || '-'}</td>
                      <td className="p-3">{u.phone || '-'}</td>
                      <td className="p-3">{new Date(u.last_login).toLocaleString()}</td>
                      <td className="p-3">{u.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden bg-white rounded-xl border border-gray-200 divide-y">
              {users.map((u) => (
                <div key={u.userId} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{u.email || u.phone || 'Unknown user'}</div>
                      <div className="text-xs text-gray-500 font-mono truncate">{u.userId}</div>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{u.count} logins</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    <div>Phone: {u.phone || '-'}</div>
                    <div>Last: {new Date(u.last_login).toLocaleString()}</div>
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

