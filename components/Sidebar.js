import Link from 'next/link'
import { useRouter } from 'next/router'
import { 
  LayoutDashboard, 
  Upload, 
  BarChart3, 
  Users, 
  Settings,
  X,
  Package,
  MessageSquare,
  Eye,
  Bell,
  FolderOpen
} from 'lucide-react'

const Sidebar = ({ isOpen, onClose }) => {
  const router = useRouter()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Upload Data', href: '/upload', icon: Upload },
    { name: 'Click Tracking', href: '/tracking', icon: BarChart3 },
    { name: 'Bookings', href: '/bookings', icon: MessageSquare },
    { name: 'Manage Categories', href: '/manage-categories', icon: FolderOpen },
    { name: 'Manage Items', href: '/manage-items', icon: Package },
    { name: 'Manage Admins', href: '/manage-admins', icon: Users },
    { name: 'Analytics', href: '/analytics', icon: Eye },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo and close button */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">Taliyo Admin</h1>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = router.pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                  ${isActive 
                    ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
                onClick={() => onClose()}
              >
                <item.icon size={20} className="mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Taliyo Admin Panel v1.0
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
