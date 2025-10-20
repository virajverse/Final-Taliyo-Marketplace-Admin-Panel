import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [router.pathname])

  const checkAuthStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.admin)
        if (router.pathname === '/login') router.push('/')
      } else {
        setUser(null)
        if (router.pathname !== '/login') router.push('/login')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
      if (router.pathname !== '/login') router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  // Show loading spinner during auth check
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Pass user to all pages
  return <Component {...pageProps} user={user} />
}

export default MyApp
