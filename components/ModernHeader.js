import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import { 
  Menu, 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Globe
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const ModernHeader = ({ user, onMenuClick }) => {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const userMenuRef = useRef(null)
  const notificationRef = useRef(null)
  const [theme, setTheme] = useState('light')
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  const { name, email, role, loginTime } = user || {}
  const displayName = name || 'Admin User'
  const displayEmail = email || 'admin@taliyo.com'
  const displayRole = useMemo(() => {
    if (!role) return 'Super Admin'
    return role
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }, [role])
  const formattedLoginTime = useMemo(() => {
    if (!loginTime) return null
    try {
      return new Date(loginTime).toLocaleString()
    } catch {
      return null
    }
  }, [loginTime])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
      const t = saved || 'light'
      setTheme(t)
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', t === 'dark')
      }
    } catch {}
  }, [])

  useEffect(() => {
    const onStorage = (e) => {
      try {
        if (e.key === 'theme') {
          const next = e.newValue || 'light'
          setTheme(next)
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', next === 'dark')
          }
        }
      } catch {}
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorage)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', onStorage)
      }
    }
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('admin_header_rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, (payload) => {
        setNotifications(prev => ([{
          id: payload.new?.id,
          title: 'New booking received',
          message: payload.new?.service_title || 'New booking',
          time: new Date().toLocaleTimeString(),
          unread: true
        }, ...(prev || [])].slice(0, 20)))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_clicks' }, () => {
        setNotifications(prev => ([{
          id: Date.now(),
          title: 'New activity',
          message: 'New session',
          time: new Date().toLocaleTimeString(),
          unread: true
        }, ...(prev || [])].slice(0, 20)))
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const row = payload?.new || {}
        if (row && (row.user_id === null || typeof row.user_id === 'undefined')) {
          setNotifications(prev => ([{
            id: row.id,
            title: row.title || 'Notification',
            message: row.message || '',
            time: row.created_at ? new Date(row.created_at).toLocaleTimeString() : new Date().toLocaleTimeString(),
            unread: true
          }, ...(prev || [])].slice(0, 20)))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleLogout = async () => {
    try {
      const getCsrf = () => {
        try { return document.cookie.split('; ').find(x => x.startsWith('csrf_token='))?.split('=')[1] || '' } catch { return '' }
      }
      await fetch('/api/admin/auth/logout', { method: 'POST', headers: { 'x-csrf-token': getCsrf() } })
    } catch {}
    router.push('/login')
  }

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New booking received', message: 'Web Development service', time: '2 min ago', unread: true },
    { id: 2, title: 'Product uploaded', message: 'Mobile App Design added', time: '1 hour ago', unread: true },
    { id: 3, title: 'Analytics report', message: 'Weekly summary available', time: '3 hours ago', unread: false }
  ])


  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div className="hidden md:block">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, orders, customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Mobile search button */}
          <button onClick={() => setShowMobileSearch(true)} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <Search size={20} />
          </button>

          {/* Theme toggle */}
          <button onClick={() => {
            const next = theme === 'dark' ? 'light' : 'dark'
            setTheme(next)
            if (typeof document !== 'undefined') {
              document.documentElement.classList.toggle('dark', next === 'dark')
            }
            try { if (typeof window !== 'undefined') localStorage.setItem('theme', next) } catch {}
          }} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => {
                const open = !showNotifications
                setShowNotifications(open)
                if (open) {
                  setNotifications(prev => (prev || []).map(n => ({ ...n, unread: false })))
                }
              }}
              className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                        notification.unread ? 'border-blue-500 bg-blue-50/30' : 'border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{notification.title}</p>
                          <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                        </div>
                        <span className="text-xs text-gray-500 ml-2">{notification.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-gray-200">
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="hidden md:block text-left max-w-[160px]">
                <p className="text-sm font-medium text-gray-900 break-words">{displayName}</p>
                <p className="text-xs text-gray-500 break-words">{displayRole}</p>
              </div>
              <ChevronDown size={16} className="text-gray-500" />
            </button>

            {/* User dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="font-medium text-gray-900 break-words">{displayName}</p>
                  <p className="text-sm text-gray-500 break-words">{displayEmail}</p>
                  {formattedLoginTime && (
                    <p className="mt-1 text-xs text-gray-400 break-words">Original login: {formattedLoginTime}</p>
                  )}
                </div>
                
                <div className="py-2">
                  <button
                    onClick={() => router.push('/settings')}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings size={16} className="mr-3" />
                    Settings
                  </button>
                  
                  <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Globe size={16} className="mr-3" />
                    Language
                  </button>
                </div>
                
                <div className="border-t border-gray-200 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} className="mr-3" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {showMobileSearch && (
        <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-sm p-4 md:hidden">
          <div className="flex items-center space-x-2">
            <Search size={20} className="text-gray-500" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, orders, customers..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button onClick={() => setShowMobileSearch(false)} className="px-3 py-2 text-sm rounded-lg border border-gray-300">Close</button>
          </div>
        </div>
      )}
    </header>
  )
}

export default ModernHeader