import { useEffect, useState } from 'react'
import ModernLayout from '../components/ModernLayout'
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  MousePointer,
  Calendar,
  Filter,
  Download
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const Tracking = ({ user }) => {
  const [clickData, setClickData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [dateRange, setDateRange] = useState('7') // days
  const [stats, setStats] = useState({
    totalClicks: 0,
    todayClicks: 0,
    topItem: null
  })

  useEffect(() => {
    if (user) {
      loadClickData()
    }
  }, [user, dateRange])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('tracking_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_clicks' }, () => {
        loadClickData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        loadClickData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, dateRange])

  useEffect(() => {
    if (!user) return
    const id = setInterval(() => loadClickData(), 10000)
    return () => clearInterval(id)
  }, [user, dateRange])

  useEffect(() => {
    applyFilters()
  }, [clickData, filter])

  const loadClickData = async () => {
    try {
      // Calculate date range
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - parseInt(dateRange))

      // Get click data with item/service details
      const { data: clicks, error } = await supabase
        .from('order_clicks')
        .select(`
          *,
          items (
            id,
            title,
            type,
            category,
            whatsapp_link
          ),
          services (
            id,
            title
          )
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      setClickData(clicks || [])

      // Calculate stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayClicks = clicks?.filter(click => 
        new Date(click.created_at) >= today
      ).length || 0

      // Find most clicked item/service
      const clickCounts = {}
      clicks?.forEach(click => {
        const id = click.services?.id || click.items?.id
        if (id) clickCounts[id] = (clickCounts[id] || 0) + 1
      })

      const topId = Object.keys(clickCounts).reduce((a, b) => 
        (clickCounts[a] || 0) > (clickCounts[b] || 0) ? a : b, null
      )

      const topItem = clicks?.find(click => 
        (click.services?.id?.toString() === topId) || (click.items?.id?.toString() === topId)
      )?.services || clicks?.find(click => click.items?.id?.toString() === topId)?.items

      setStats({
        totalClicks: clicks?.length || 0,
        todayClicks,
        topItem
      })
    } catch (error) {
      console.error('Error loading click data:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    if (filter === 'all') {
      setFilteredData(clickData)
    } else {
      setFilteredData(clickData.filter(click => {
        const t = click.items?.type || (click.services ? 'service' : null)
        return t === filter
      }))
    }
  }

  const exportData = () => {
    const csvContent = [
      ['Date', 'Time', 'Item Title', 'Type', 'Category'],
      ...filteredData.map(click => {
        const type = click.items?.type || (click.services ? 'service' : 'Unknown')
        return [
          new Date(click.created_at).toLocaleDateString(),
          new Date(click.created_at).toLocaleTimeString(),
          click.services?.title || click.items?.title || 'Unknown',
          type,
          click.items?.category || 'Unknown'
        ]
      })
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `click-tracking-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
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
            <h1 className="text-3xl font-bold text-gray-900">Click Tracking</h1>
            <p className="text-gray-600 mt-2">
              Monitor WhatsApp order clicks and user engagement.
            </p>
          </div>
          <button
            onClick={exportData}
            className="btn-secondary flex items-center"
          >
            <Download size={16} className="mr-2" />
            Export CSV
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    stats.totalClicks.toLocaleString()
                  )}
                </p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <MousePointer size={24} className="text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Clicks</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    stats.todayClicks.toLocaleString()
                  )}
                </p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <TrendingUp size={24} className="text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Item</p>
                <p className="text-lg font-semibold text-gray-900 mt-2">
                  {loading ? (
                    <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    stats.topItem?.title?.slice(0, 20) + '...' || 'No data'
                  )}
                </p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <BarChart3 size={24} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="form-input w-auto"
            >
              <option value="all">All Types</option>
              <option value="service">Services</option>
              <option value="product">Products</option>
              <option value="package">Packages</option>
            </select>

            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="form-input w-auto"
              >
                <option value="1">Last 24 hours</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Click Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Clicks</h2>
            <p className="text-sm text-gray-600">Showing {filteredData.length} clicks</p>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="loading-spinner mx-auto mb-4"></div>
                <p className="text-gray-600">Loading click data...</p>
              </div>
            ) : filteredData.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Item</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((click, index) => (
                    <tr key={index}>
                      <td>
                        <div>
                          <div className="font-medium">
                            {new Date(click.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(click.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="font-medium">
                          {click.services?.title || click.items?.title || 'Unknown Item'}
                        </div>
                      </td>
                      <td>
                        {(() => {
                          const type = click.items?.type || (click.services ? 'service' : 'Unknown')
                          const cls = type === 'service' ? 'bg-blue-100 text-blue-800' : type === 'product' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                          return (
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${cls}`}>
                              {type}
                            </span>
                          )
                        })()}
                      </td>
                      <td>{click.items?.category || 'Uncategorized'}</td>
                      <td>
                        {click.items?.whatsapp_link && (
                          <a
                            href={click.items.whatsapp_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            View WhatsApp
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center">
                <Eye size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No click data found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Click tracking will appear here once users start clicking on items
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModernLayout>
  )
}

export default Tracking
