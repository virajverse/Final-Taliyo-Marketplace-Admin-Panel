// Simple stats without charts to avoid recharts issues
export function SimplePerformanceStats({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">📊</div>
          <p className="text-gray-600 mt-2">Performance Chart</p>
          <p className="text-sm text-gray-500">Data will appear here</p>
        </div>
      </div>
    )
  }

  const latest = data[data.length - 1] || {}
  const previous = data[data.length - 2] || {}
  const growth = latest.growth || 0
  const change = previous.growth ? ((growth - previous.growth) / previous.growth * 100).toFixed(1) : 0

  return (
    <div className="w-full h-[300px] bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl font-bold text-purple-600 mb-2">{growth}</div>
        <div className="text-lg text-gray-700 mb-2">Monthly Growth</div>
        <div className="flex items-center justify-center">
          <span className={`text-sm px-2 py-1 rounded-full ${
            change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {change >= 0 ? '↗' : '↘'} {Math.abs(change)}%
          </span>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          Chart will load after database setup
        </div>
      </div>
    </div>
  )
}

export function SimpleRevenueStats({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">💰</div>
          <p className="text-gray-600 mt-2">Revenue Chart</p>
          <p className="text-sm text-gray-500">Data will appear here</p>
        </div>
      </div>
    )
  }

  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0)
  const avgRevenue = Math.round(totalRevenue / data.length)

  return (
    <div className="w-full h-[300px] bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl font-bold text-green-600 mb-2">₹{avgRevenue.toLocaleString()}</div>
        <div className="text-lg text-gray-700 mb-2">Average Revenue</div>
        <div className="text-sm text-gray-500 mb-4">
          Total: ₹{totalRevenue.toLocaleString()}
        </div>
        <div className="mt-4 text-xs text-gray-500">
          Chart will load after database setup
        </div>
      </div>
    </div>
  )
}

export function SimpleCategoryStats({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">📈</div>
          <p className="text-gray-600 mt-2">Category Distribution</p>
          <p className="text-sm text-gray-500">Data will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[300px] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
      <div className="text-center mb-6">
        <div className="text-lg font-semibold text-gray-900">Category Distribution</div>
      </div>
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
            </div>
            <div className="flex items-center">
              <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                <div 
                  className="h-2 rounded-full"
                  style={{ 
                    backgroundColor: item.color,
                    width: `${item.value}%`
                  }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">{item.value}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}