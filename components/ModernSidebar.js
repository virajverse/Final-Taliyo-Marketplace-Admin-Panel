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
  FolderOpen,
  Plus,
  ShoppingBag,
  FileText,
  TrendingUp,
  Bell,
  HelpCircle
} from 'lucide-react'

const ModernSidebar = ({ isOpen, onClose }) => {
  const router = useRouter()

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/', 
      icon: LayoutDashboard,
      description: 'Overview & Analytics'
    },
    { 
      name: 'Products', 
      href: '/products', 
      icon: Package,
      description: 'Manage Services & Items',
      badge: 'New'
    },
    { 
      name: 'Bookings', 
      href: '/bookings', 
      icon: MessageSquare,
      description: 'Customer Orders'
    },
    { 
      name: 'Categories', 
      href: '/manage-categories', 
      icon: FolderOpen,
      description: 'Organize Products'
    },
    { 
      name: 'Analytics', 
      href: '/analytics', 
      icon: TrendingUp,
      description: 'Performance Metrics'
    },
    { 
      name: 'Upload Data', 
      href: '/upload', 
      icon: Upload,
      description: 'Bulk Import'
    },
    { 
      name: 'Click Tracking', 
      href: '/tracking', 
      icon: BarChart3,
      description: 'User Interactions'
    },
    { 
      name: 'Banner Analytics', 
      href: '/banner-analytics', 
      icon: TrendingUp,
      description: 'Banners Impressions & CTR'
    },
    { 
      name: 'Admins', 
      href: '/manage-admins', 
      icon: Users,
      description: 'User Management'
    },
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: Settings,
      description: 'System Configuration'
    }
  ]

  const quickActions = [
    { name: 'Add Product', icon: Plus, action: () => router.push('/products?add=true') },
    { name: 'View Orders', icon: ShoppingBag, action: () => router.push('/bookings') },
    { name: 'Analytics', icon: Eye, action: () => router.push('/analytics') },
    { name: 'Banner Analytics', icon: BarChart3, action: () => router.push('/banner-analytics') }
  ]

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        lg:fixed lg:inset-y-0 lg:left-0 lg:translate-x-0 lg:flex-shrink-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <h1 className="text-lg font-bold text-white">Taliyo Admin</h1>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-white hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = router.pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-sm border-l-4 border-blue-500' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                onClick={() => onClose()}
              >
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-lg mr-3 transition-colors
                  ${isActive 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                  }
                `}>
                  <item.icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.name}</span>
                    {item.badge && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {item.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="space-y-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <action.icon size={16} className="mr-3 text-gray-500" />
                {action.name}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Taliyo Admin v2.0</span>
            <button className="text-gray-400 hover:text-gray-600">
              <HelpCircle size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ModernSidebar