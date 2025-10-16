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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Logins</h1>
            <p className="text-sm text-gray-600">Per-customer login activity (last {data.eventsCount} events)</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by email / phone / userId"
              className="border border-gray-300 rounded-lg px-3 py-2 w-72"
            />
            <button onClick={load} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Search</button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 mb-4">{error}</div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6">Loading...</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
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
        )}
      </div>
    </div>
  )
}
