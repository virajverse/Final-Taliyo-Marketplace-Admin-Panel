import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { 
  User, 
  Shield, 
  Bell, 
  Database,
  Key,
  Save,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react'

const Settings = ({ user }) => {
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: ''
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: false,
    newBookings: false,
    newMessages: false,
    weeklyReports: false,
    marketingEmails: false
  })

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    allowRegistrations: true,
    autoApproveServices: false,
    maxFileSize: '10',
    supportEmail: ''
  })

  useEffect(() => {
    if (user) {
      loadUserProfile()
    }
  }, [user])

  const loadUserProfile = async () => {
    try {
      // Load from localStorage if available
      const savedProfile = localStorage.getItem('adminProfile')
      const savedNotifications = localStorage.getItem('adminNotifications')
      const savedSystemSettings = localStorage.getItem('adminSystemSettings')
      
      if (savedProfile) {
        setProfileData(JSON.parse(savedProfile))
      } else {
        setProfileData({
          name: '',
          email: user?.email || '',
          phone: '',
          bio: ''
        })
      }
      
      if (savedNotifications) {
        setNotificationSettings(JSON.parse(savedNotifications))
      }
      
      if (savedSystemSettings) {
        setSystemSettings(JSON.parse(savedSystemSettings))
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Save to localStorage
      localStorage.setItem('adminProfile', JSON.stringify(profileData))
      
      // Update session data
      const currentSession = JSON.parse(localStorage.getItem('adminAuth') || '{}')
      currentSession.profile = profileData
      localStorage.setItem('adminAuth', JSON.stringify(currentSession))
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      setSuccess('Profile updated successfully')
    } catch (error) {
      setError('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotifications = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Save to localStorage
      localStorage.setItem('adminNotifications', JSON.stringify(notificationSettings))
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      setSuccess('Notification settings updated successfully')
    } catch (error) {
      setError('Failed to update notification settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSystem = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Save to localStorage
      localStorage.setItem('adminSystemSettings', JSON.stringify(systemSettings))
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      setSuccess('System settings updated successfully')
    } catch (error) {
      setError('Failed to update system settings')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'system', name: 'System', icon: Database }
  ]

  if (!user) {
    return null
  }

  return (
    <Layout user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account settings and application preferences.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert-error">
            <div className="flex items-start">
              <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-auto">
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
              <button onClick={() => setSuccess('')} className="ml-auto">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon size={16} className="mr-3" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>
                  
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="form-label">Full Name</label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="form-input"
                          placeholder="Enter your full name"
                        />
                      </div>

                      <div>
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="form-input"
                          disabled
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="form-input"
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div>
                      <label className="form-label">Bio</label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                        className="form-input"
                        rows={3}
                        placeholder="Tell us about yourself"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className={`btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {loading ? (
                          <>
                            <div className="loading-spinner mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={16} className="mr-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                  
                  <form onSubmit={handleSaveNotifications} className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Email Notifications</h3>
                          <p className="text-sm text-gray-500">Receive notifications via email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings.emailNotifications}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              emailNotifications: e.target.checked
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">New Bookings</h3>
                          <p className="text-sm text-gray-500">Get notified when new bookings are made</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings.newBookings}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              newBookings: e.target.checked
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">New Messages</h3>
                          <p className="text-sm text-gray-500">Get notified about new messages</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings.newMessages}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              newMessages: e.target.checked
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Weekly Reports</h3>
                          <p className="text-sm text-gray-500">Receive weekly analytics reports</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings.weeklyReports}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
                              weeklyReports: e.target.checked
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className={`btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {loading ? (
                          <>
                            <div className="loading-spinner mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={16} className="mr-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h2>
                  
                  <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Password</h3>
                          <p className="text-sm text-gray-500">Simple authentication enabled</p>
                        </div>
                        <button 
                          onClick={() => alert('Password change functionality disabled for simple auth')}
                          className="btn-secondary flex items-center opacity-50 cursor-not-allowed"
                          disabled
                        >
                          <Key size={16} className="mr-2" />
                          Change Password
                        </button>
                      </div>
                    </div>

                    <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="font-medium text-yellow-800">Two-Factor Authentication - Disabled</h3>
                          <p className="text-sm text-yellow-700 mt-1">
                            2FA is disabled for development purposes. This admin panel uses simple localStorage-based authentication for easier testing and development.
                          </p>
                          <div className="mt-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Disabled for Development
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Login Sessions</h3>
                          <p className="text-sm text-gray-500">Current session: Browser localStorage</p>
                        </div>
                        <button 
                          onClick={() => {
                            localStorage.removeItem('adminAuth')
                            alert('Session cleared! You will be redirected to login.')
                            window.location.href = '/login'
                          }}
                          className="btn-secondary text-red-600 hover:bg-red-50"
                        >
                          Clear Session
                        </button>
                      </div>
                    </div>

                    <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <Shield className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="font-medium text-blue-800">Security Notice</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            This is a development environment with simplified authentication. In production, implement proper JWT tokens, password hashing, and 2FA.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* System Tab */}
              {activeTab === 'system' && (
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">System Settings</h2>
                  
                  <form onSubmit={handleSaveSystem} className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Maintenance Mode</h3>
                          <p className="text-sm text-gray-500">Temporarily disable public access</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.maintenanceMode}
                            onChange={(e) => setSystemSettings({
                              ...systemSettings,
                              maintenanceMode: e.target.checked
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Auto-Publish Services</h3>
                          <p className="text-sm text-gray-500">Automatically publish new services</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.allowRegistrations}
                            onChange={(e) => setSystemSettings({
                              ...systemSettings,
                              allowRegistrations: e.target.checked
                            })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="form-label">Max File Size (MB)</label>
                        <input
                          type="number"
                          value={systemSettings.maxFileSize}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            maxFileSize: e.target.value
                          })}
                          className="form-input"
                          min="1"
                          max="100"
                        />
                      </div>

                      <div>
                        <label className="form-label">Support Email</label>
                        <input
                          type="email"
                          value={systemSettings.supportEmail}
                          onChange={(e) => setSystemSettings({
                            ...systemSettings,
                            supportEmail: e.target.value
                          })}
                          className="form-input"
                          placeholder="Enter support email address"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className={`btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {loading ? (
                          <>
                            <div className="loading-spinner mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={16} className="mr-2" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Settings
