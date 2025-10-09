import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
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

  useEffect(() => {
    if (user) {
      loadAdmins()
    }
  }, [user])

  const loadAdmins = async () => {
    try {
      // Get admins from database
      const { data: dbAdmins, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Combine with hardcoded admins
      const hardcodedAdmins = ALLOWED_ADMIN_EMAILS.map(email => ({
        id: email,
        email,
        is_active: true,
        created_at: '2024-01-01',
        is_hardcoded: true
      }))

      setAdmins([...hardcodedAdmins, ...(dbAdmins || [])])
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

      // Add to database
      const { data, error } = await supabase
        .from('admins')
        .insert([{
          email: newAdminEmail.toLowerCase(),
          is_active: true
        }])
        .select()
        .single()

      if (error) throw error

      // Update local state
      setAdmins([...admins, data])
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
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', adminId)

      if (error) throw error

      // Update local state
      setAdmins(admins.filter(admin => admin.id !== adminId))
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
      const { error } = await supabase
        .from('admins')
        .update({ is_active: !currentStatus })
        .eq('id', adminId)

      if (error) throw error

      // Update local state
      setAdmins(admins.map(admin => 
        admin.id === adminId 
          ? { ...admin, is_active: !currentStatus }
          : admin
      ))

      setSuccess(`Admin ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error updating admin status:', error)
      setError('Failed to update admin status')
    }
  }

  if (!user) {
    return null
  }

  return (
    <Layout user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Admins</h1>
            <p className="text-gray-600 mt-2">
              Control who has access to the admin panel.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Add Admin
          </button>
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

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="loading-spinner mx-auto mb-4"></div>
                <p className="text-gray-600">Loading admins...</p>
              </div>
            ) : admins.length > 0 ? (
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
            ) : (
              <div className="p-8 text-center">
                <Users size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No admins found</p>
              </div>
            )}
          </div>
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
    </Layout>
  )
}

export default ManageAdmins
