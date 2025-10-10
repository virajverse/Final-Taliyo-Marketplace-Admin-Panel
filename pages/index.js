import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
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
import { supabase } from '../lib/supabaseClient'

// Import simple stats component (no recharts)
import { SimplePerformanceStats } from '../components/SimpleStats'

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalItems: 0,
    totalClicks: 0,
    totalAdmins: 0,
    recentClicks: 0,
    totalRevenue: 127500,
    avgSessionTime: '02:34',
    conversionRate: 8.7,
    responseTime: 95
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [performanceData, setPerformanceData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [auditData, setAuditData] = useState([])

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      // Get total items count (with error handling)
      let itemsCount = 0
      try {
        const { count } = await supabase
          .from('items')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
        itemsCount = count || 0
      } catch (error) {
        console.log('Items table not accessible:', error.message)
      }

      // Get total clicks count (with error handling)
      let clicksCount = 0
      try {
        const { count } = await supabase
          .from('order_clicks')
          .select('*', { count: 'exact', head: true })
        clicksCount = count || 0
      } catch (error) {
        console.log('Order_clicks table not accessible:', error.message)
      }

      // Get total admins count (with error handling)
      let adminsCount = 2
      try {
        const { count } = await supabase
          .from('admins')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
        adminsCount = count || 2
      } catch (error) {
        console.log('Admins table not accessible:', error.message)
      }

      // Get recent clicks (with error handling)
      let recentClicksCount = 0
      try {
        const yesterday = new Date()
        yesterday.setHours(yesterday.getHours() - 24)
        
        const { count } = await supabase
          .from('order_clicks')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', yesterday.toISOString())
        recentClicksCount = count || 0
      } catch (error) {
        console.log('Recent clicks not accessible:', error.message)
      }

      // Get recent activity
      const { data: clicks } = await supabase
        .from('order_clicks')
        .select(`
          *,
          items (
            title,
            type
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      // Generate performance data for chart
      const performanceData = Array.from({ length: 12 }, (_, i) => {
        const month = new Date()
        month.setMonth(month.getMonth() - (11 - i))
        return {
          month: month.toLocaleDateString('en-US', { month: 'short' }),
          growth: Math.floor(Math.random() * 500) + 200,
          revenue: Math.floor(Math.random() * 50000) + 25000,
          users: Math.floor(Math.random() * 100) + 50
        }
      })

      // Generate category distribution
      const categoryData = [
        { name: 'Services', value: 45, color: '#8B5CF6' },
        { name: 'Products', value: 30, color: '#06B6D4' },
        { name: 'Packages', value: 25, color: '#10B981' }
      ]

      // Generate audit data
      const auditData = [
        { action: 'Service Created', user: 'Admin', target: 'Web Development', timestamp: '2024-01-15 14:30', status: 'Success' },
        { action: 'Item Updated', user: 'Admin', target: 'Mobile Design', timestamp: '2024-01-15 13:45', status: 'Success' },
        { action: 'Category Added', user: 'Admin', target: 'Digital Marketing', timestamp: '2024-01-15 12:20', status: 'Success' },
        { action: 'Service Activated', user: 'System', target: 'Graphic Design', timestamp: '2024-01-15 11:15', status: 'Success' },
        { action: 'Analytics Updated', user: 'System', target: 'Monthly Report', timestamp: '2024-01-15 10:30', status: 'Success' }
      ]

      setStats({
        totalItems: itemsCount || 0,
        totalClicks: clicksCount || 0,
        totalAdmins: adminsCount || 2,
        recentClicks: recentClicksCount || 0,
        totalRevenue: 127500,
        avgSessionTime: '02:34',
        conversionRate: 8.7,
        responseTime: 95
      })

      setRecentActivity(clicks || [])
      setPerformanceData(performanceData)
      setCategoryData(categoryData)
      setAuditData(auditData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Sessions',
      value: `${stats.totalClicks}k`,
      subtitle: '+18% from last month',
      icon: Activity,
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Avg Sessions',
      value: stats.avgSessionTime,
      subtitle: '+12% from last month',
      icon: Clock,
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Revenue',
      value: `₹${(stats.totalRevenue / 1000).toFixed(0)}k`,
      subtitle: '+25% from last month',
      icon: DollarSign,
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate}%`,
      subtitle: '+8% from last month',
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
                  <p className="text-3xl font-bold mt-2">
                    {loading ? (
                      <div className="h-8 w-16 bg-white/20 rounded animate-pulse"></div>
                    ) : (
                      stat.value
                    )}
                  </p>
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
                    <p className="text-2xl font-bold text-purple-600">₹32001</p>
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
                      strokeDasharray="75, 100"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">75%</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Overall Performance</p>
                <p className="text-xs text-gray-500 mt-1">+5% from last month</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Response Time</span>
                  <span className="text-sm font-semibold text-green-600">{stats.responseTime}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Customer Satisfaction</span>
                  <span className="text-sm font-semibold text-blue-600">98.2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <span className="text-sm font-semibold text-purple-600">99.9%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Users</span>
                  <span className="text-sm font-semibold text-orange-600">1,247</span>
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
          <div className="overflow-x-auto">
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
                {auditData.map((audit, index) => (
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
        </div>

          
      </div>
    </ModernLayout>
  )
}

export default Dashboard
