import { useEffect, useState } from 'react'
import ModernLayout from '../components/ModernLayout'
import { 
  BarChart3, 
  Users, 
  Package, 
  TrendingUp,
  Eye,
  MousePointer,
  ShoppingCart,
  DollarSign,
  Activity,
  Clock,
  Target
} from 'lucide-react'

// Import simple stats component (no recharts)
import { SimplePerformanceStats } from '../components/SimpleStats'

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalClicks: 0,
    totalAdmins: 0,
    recentClicks: 0,
    totalRevenue: 0,
    bookingsCount: 0,
    conversionRate: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [performanceData, setPerformanceData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [auditData, setAuditData] = useState([])
  const [thisMonthRevenue, setThisMonthRevenue] = useState(0)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  // Realtime channel removed for performance; rely on short polling with cached API

  useEffect(() => {
    if (!user) return
    const id = setInterval(() => {
      loadDashboardData()
    }, 30000)
    return () => clearInterval(id)
  }, [user])

  const loadDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/metrics')
      if (!res.ok) throw new Error('metrics_failed')
      const m = await res.json()
      setStats({
        totalItems: m.totalItems || 0,
        totalClicks: m.totalClicks || 0,
        totalAdmins: m.totalAdmins || 0,
        recentClicks: m.recentClicks || 0,
        totalRevenue: m.totalRevenue || 0,
        bookingsCount: m.bookingsCount || 0,
        conversionRate: m.conversionRate || 0
      })
      setThisMonthRevenue(m.thisMonthRevenue || 0)
      setRecentActivity(m.recentActivity || [])
      setPerformanceData(m.performanceData || [])
      setCategoryData(m.categoryData || [])
      setAuditData([])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Sessions',
      value: stats.totalClicks.toLocaleString(),
      subtitle: `${stats.recentClicks} in last 24h`,
      icon: Activity,
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Items',
      value: stats.totalItems.toLocaleString(),
      subtitle: 'Active items',
      icon: Package,
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Revenue',
      value: `₹${Math.round(stats.totalRevenue).toLocaleString()}`,
      subtitle: `This Month: ₹${thisMonthRevenue.toLocaleString()}`,
      icon: DollarSign,
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: 'Conversion Rate',
      value: `${(stats.conversionRate || 0).toFixed(1)}%`,
      subtitle: 'Bookings / Sessions',
      icon: Target,
      gradient: 'from-orange-500 to-orange-600'
    }
  ]

  if (!user) {
    return null
  }

  return (
    <ModernLayout user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Here's what's happening with your marketplace.
          </p>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div key={index} className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">{stat.title}</p>
                  <div className="text-3xl font-bold mt-2">
                    {loading ? (
                      <span className="inline-block h-8 w-16 bg-white/20 rounded animate-pulse"></span>
                    ) : (
                      <span>{stat.value}</span>
                    )}
                  </div>
                  <div className="flex items-center mt-3">
                    <TrendingUp size={14} className="mr-1 text-white/90" />
                    <span className="text-sm text-white/90 font-medium">
                      {stat.subtitle}
                    </span>
                  </div>
                </div>
                <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                  <stat.icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Performance Growth Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Profile Growth</h2>
                  <p className="text-sm text-gray-600 mt-1">Monthly marketplace analytics</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">₹{thisMonthRevenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">This Month</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <SimplePerformanceStats data={performanceData} />
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-6">
            {/* Circular Progress */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                      fill="none"
                      stroke="#f1f5f9"
                      strokeWidth="2"
                    />
                    <path
                      d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="2"
                      strokeDasharray={`${Math.min(100, Math.max(0, stats.conversionRate || 0))}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">{(stats.conversionRate || 0).toFixed(1)}%</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-xs text-gray-500 mt-1">Bookings / Sessions</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Admins Active</span>
                  <span className="text-sm font-semibold text-green-600">{stats.totalAdmins}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Bookings Total</span>
                  <span className="text-sm font-semibold text-blue-600">{stats.bookingsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Clicks (24h)</span>
                  <span className="text-sm font-semibold text-purple-600">{stats.recentClicks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Items Active</span>
                  <span className="text-sm font-semibold text-orange-600">{stats.totalItems}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Recent Activities</h2>
                <p className="text-sm text-gray-600 mt-1">Latest system activities and user actions</p>
              </div>
              <button className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                View All
              </button>
            </div>
          </div>
          {/* Desktop/Tablets: wide table */}
          <div className="overflow-x-auto hidden md:block">
            <table className="min-w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentActivity.map((audit, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {audit.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {audit.user}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {audit.target}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {audit.timestamp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        audit.status === 'Success' 
                          ? 'bg-green-100 text-green-800'
                          : audit.status === 'Warning'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {audit.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile: cards */}
          <div className="md:hidden">
            <div className="divide-y divide-gray-100">
              {recentActivity.map((audit, index) => (
                <div key={index} className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">{audit.action}</div>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      audit.status === 'Success'
                        ? 'bg-green-100 text-green-800'
                        : audit.status === 'Warning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {audit.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {audit.target}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{audit.user}</span>
                    <span>{audit.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

          
      </div>
    </ModernLayout>
  )
}

export default Dashboard
