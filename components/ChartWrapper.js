import { useEffect, useState } from 'react'

// Wrapper component to fix recharts SSR/hydration issues
const ChartWrapper = ({ children }) => {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return <>{children}</>
}

export default ChartWrapper
