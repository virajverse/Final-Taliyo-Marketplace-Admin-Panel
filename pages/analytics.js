import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import ModernLayout from '../components/ModernLayout'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Eye,
  MousePointer,
  Calendar,
  Package
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

// Import simple stats components (no recharts)
import { SimpleRevenueStats, SimpleCategoryStats, SimplePerformanceStats } from '../components/SimpleStats'

const Analytics = ({ user }) => {
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalItems: 0,
    totalClicks: 0,
    avgRating: 0,
    growthData: [],
    categoryData: [],
    clickTrends: [],
    topItems: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30') // days

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user, timeRange])

  const loadAnalytics = async () => {
    try {
      const res = await fetch(`/api/admin/analytics?days=${timeRange}`)
      if (!res.ok) throw new Error('Analytics API failed')
      const data = await res.json()
      setAnalytics({
        totalRevenue: data.totalRevenue || 0,
        totalItems: data.totalItems || 0,
        totalClicks: data.totalClicks || 0,
        avgRating: data.avgRating || 0,
        growthData: data.growthData || [],
        categoryData: data.categoryData || [],
        clickTrends: data.clickTrends || [],
        topItems: data.topItems || []
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Realtime refresh on key tables
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('admin_analytics_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_clicks' }, () => loadAnalytics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => loadAnalytics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => loadAnalytics())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => loadAnalytics())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, timeRange])

  // Polling fallback every 10s
  useEffect(() => {
    if (!user) return
    const id = setInterval(() => loadAnalytics(), 10000)
    return () => clearInterval(id)
  }, [user, timeRange])

  if (!user) {
    return null
  }

  return (
    <ModernLayout user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Comprehensive insights into your marketplace performance
            </p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="form-input w-full md:w-auto"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold">₹{analytics.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp size={16} className="mr-1" />
                  <span className="text-sm">+12.5% from last month</span>
                </div>
              </div>
              <DollarSign size={32} className="text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Items</p>
                <p className="text-3xl font-bold">{analytics.totalItems}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp size={16} className="mr-1" />
                  <span className="text-sm">+8.2% from last month</span>
                </div>
              </div>
              <Package size={32} className="text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Clicks</p>
                <p className="text-3xl font-bold">{analytics.totalClicks}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp size={16} className="mr-1" />
                  <span className="text-sm">+15.7% from last month</span>
                </div>
              </div>
              <MousePointer size={32} className="text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Avg Rating</p>
                <p className="text-3xl font-bold">{analytics.avgRating}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp size={16} className="mr-1" />
                  <span className="text-sm">+0.3 from last month</span>
                </div>
              </div>
              <Eye size={32} className="text-orange-200" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Growth Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Growth</h3>
            <SimpleRevenueStats data={analytics.growthData} />
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
            <SimpleCategoryStats data={analytics.categoryData} />
            <div className="flex justify-center space-x-4 mt-4">
              {analytics.categoryData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Click Trends */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Click Trends</h3>
            <SimplePerformanceStats data={analytics.clickTrends} />
          </div>

          {/* Top Performing Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Items</h3>
            <div className="space-y-4">
              {analytics.topItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.clicks} clicks</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">₹{item.revenue.toLocaleString()}</p>
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

export default Analytics
