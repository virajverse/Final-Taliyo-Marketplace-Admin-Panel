import { useEffect, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import ModernLayout from '../components/ModernLayout'
import { 
  Users, 
  Plus, 
  Trash2, 
  Mail, 
  Shield,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { ALLOWED_ADMIN_EMAILS } from '../lib/auth'

const ManageAdmins = ({ user }) => {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const getCsrf = () => {
    try { return document.cookie.split('; ').find(x => x.startsWith('csrf_token='))?.split('=')[1] || '' } catch { return '' }
  }

  const fetcher = async (url) => {
    const res = await fetch(url)
    if (res.status === 401) { window.location.href = '/login?error=unauthorized'; throw new Error('unauthorized') }
    const json = await res.json()
    if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to load admins')
    return json?.data || []
  }

  const { data: adminsData, error: swrError, isLoading, mutate } = useSWR(user ? '/api/admin/admins' : null, fetcher, { revalidateOnFocus: true })

  useEffect(() => { if (adminsData) { setAdmins(adminsData); } }, [adminsData])
  useEffect(() => { if (swrError) { setError('Failed to load admin list') } }, [swrError])
  useEffect(() => { setLoading(!!isLoading) }, [isLoading])

  useEffect(() => {
    if (user) { mutate() }
  }, [user, mutate])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('admins_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admins' }, () => {
        mutate()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    const id = setInterval(() => mutate(), 10000)
    return () => clearInterval(id)
  }, [user, mutate])

  const loadAdmins = async () => {
    try {
      const res = await fetch('/api/admin/admins')
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to load admins')
      setAdmins(json?.data || [])
    } catch (error) {
      console.error('Error loading admins:', error)
      setError('Failed to load admin list')
    } finally {
      setLoading(false)
    }
  }

  const addAdmin = async (e) => {
    e.preventDefault()
    if (!newAdminEmail.trim()) return

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      // Check if admin already exists
      const existingAdmin = admins.find(admin => 
        admin.email.toLowerCase() === newAdminEmail.toLowerCase()
      )

      if (existingAdmin) {
        setError('This email is already an admin')
        return
      }

      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrf() },
        body: JSON.stringify({ email: newAdminEmail.toLowerCase(), is_active: true })
      })
      const json = await res.json()
      if (res.status === 401) { window.location.href = '/login?error=unauthorized'; return }
      if (!res.ok) throw new Error(json?.message || json?.error || 'Create failed')

      // Update local state then revalidate
      setAdmins([...admins, json.data])
      await mutate()
      setNewAdminEmail('')
      setShowAddForm(false)
      setSuccess('Admin added successfully')
    } catch (error) {
      console.error('Error adding admin:', error)
      setError('Failed to add admin')
    } finally {
      setSubmitting(false)
    }
  }

  const removeAdmin = async (adminId, isHardcoded) => {
    if (isHardcoded) {
      setError('Cannot remove hardcoded system administrators')
      return
    }

    if (!confirm('Are you sure you want to remove this admin?')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/admins/${adminId}`, { method: 'DELETE', headers: { 'x-csrf-token': getCsrf() } })
      const json = await res.json()
      if (res.status === 401) { window.location.href = '/login?error=unauthorized'; return }
      if (!res.ok) throw new Error(json?.message || json?.error || 'Delete failed')

      // Update local state then revalidate
      setAdmins(admins.filter(admin => admin.id !== adminId))
      await mutate()
      setSuccess('Admin removed successfully')
    } catch (error) {
      console.error('Error removing admin:', error)
      setError('Failed to remove admin')
    }
  }

  const toggleAdminStatus = async (adminId, currentStatus, isHardcoded) => {
    if (isHardcoded) {
      setError('Cannot modify hardcoded system administrators')
      return
    }

    try {
      const res = await fetch(`/api/admin/admins/${adminId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrf() },
        body: JSON.stringify({ is_active: !currentStatus })
      })
      const json = await res.json()
      if (res.status === 401) { window.location.href = '/login?error=unauthorized'; return }
      if (!res.ok) throw new Error(json?.message || json?.error || 'Update failed')

      // Update local state then revalidate
      setAdmins(admins.map(admin => 
        admin.id === adminId 
          ? json.data
          : admin
      ))

      setSuccess(`Admin ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      await mutate()
    } catch (error) {
      console.error('Error updating admin status:', error)
      setError('Failed to update admin status')
    }
  }

  if (!user) {
    return null
  }

  return (
    <ModernLayout user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Admins</h1>
            <p className="text-gray-600 mt-2">
              Control who has access to the admin panel.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/users/logins" className="btn-secondary flex items-center">
              <Users size={16} className="mr-2" />
              User Logins
            </Link>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Add Admin
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert-error">
            <div className="flex items-start">
              <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
              <button 
                onClick={() => setError('')}
                className="ml-auto"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="alert-success">
            <div className="flex items-start">
              <CheckCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{success}</span>
              <button 
                onClick={() => setSuccess('')}
                className="ml-auto"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Add Admin Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Admin</h2>
              
              <form onSubmit={addAdmin}>
                <div className="mb-4">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="form-input"
                    placeholder="admin@example.com"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setNewAdminEmail('')
                      setError('')
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`btn-primary ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {submitting ? (
                      <>
                        <div className="loading-spinner mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      'Add Admin'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Admins List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Admin Users</h2>
            <p className="text-sm text-gray-600">
              {admins.filter(a => a.is_active).length} active admins
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-gray-600">Loading admins...</p>
            </div>
          ) : admins.length > 0 ? (
            <>
              {/* Desktop/Tablet table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Type</th>
                      <th>Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin, index) => (
                      <tr key={admin.id || index}>
                        <td>
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                              <Mail size={14} className="text-primary-600" />
                            </div>
                            <div>
                              <div className="font-medium">{admin.email}</div>
                              {admin.email === user?.email && (
                                <div className="text-xs text-gray-500">You</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            admin.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {admin.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center">
                            <Shield size={14} className={`mr-1 ${
                              admin.is_hardcoded ? 'text-orange-500' : 'text-blue-500'
                            }`} />
                            <span className={`text-xs ${
                              admin.is_hardcoded ? 'text-orange-600' : 'text-blue-600'
                            }`}>
                              {admin.is_hardcoded ? 'System' : 'Added'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm text-gray-500">
                            {new Date(admin.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center space-x-2">
                            {!admin.is_hardcoded && (
                              <>
                                <button
                                  onClick={() => toggleAdminStatus(
                                    admin.id,
                                    admin.is_active,
                                    admin.is_hardcoded
                                  )}
                                  className={`text-xs px-2 py-1 rounded ${
                                    admin.is_active
                                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                                  }`}
                                >
                                  {admin.is_active ? 'Deactivate' : 'Activate'}
                                </button>

                                <button
                                  onClick={() => removeAdmin(admin.id, admin.is_hardcoded)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}

                            {admin.is_hardcoded && (
                              <span className="text-xs text-gray-400">Protected</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y">
                {admins.map((admin, index) => (
                  <div key={admin.id || index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-9 w-9 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                          <Mail size={14} className="text-primary-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{admin.email}</div>
                          {admin.email === user?.email && (
                            <div className="text-xs text-gray-500">You</div>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        admin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Shield size={12} className={`mr-1 ${admin.is_hardcoded ? 'text-orange-500' : 'text-blue-500'}`} />
                        <span className={`${admin.is_hardcoded ? 'text-orange-600' : 'text-blue-600'}`}>
                          {admin.is_hardcoded ? 'System' : 'Added'}
                        </span>
                      </div>
                      <span>{new Date(admin.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-end gap-2">
                      {!admin.is_hardcoded ? (
                        <>
                          <button
                            onClick={() => toggleAdminStatus(admin.id, admin.is_active, admin.is_hardcoded)}
                            className={`text-xs px-2 py-1 rounded ${
                              admin.is_active ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                            }`}
                          >
                            {admin.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => removeAdmin(admin.id, admin.is_hardcoded)}
                            className="text-red-600"
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">Protected</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <Users size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No admins found</p>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Admin Access Control</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>• <strong>System Admins:</strong> Hardcoded administrators that cannot be removed</p>
            <p>• <strong>Added Admins:</strong> Administrators added through this panel</p>
            <p>• <strong>Active Status:</strong> Only active admins can access the panel</p>
            <p>• <strong>Email Verification:</strong> Admins must sign in with their registered email</p>
          </div>
        </div>
      </div>
    </ModernLayout>
  )
}

export default ManageAdmins
