import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { checkSession } from '../lib/simpleAuth'
import '../styles/globals.css'

function MyApp({ Component, pageProps }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    checkAuthStatus()
  }, [router.pathname])

  const checkAuthStatus = () => {
    setLoading(true)
    
    try {
      const session = checkSession()
      
      if (session) {
        setUser(session)
        
        // Redirect to dashboard if on login page
        if (router.pathname === '/login') {
          router.push('/')
        }
      } else {
        setUser(null)
        
        // Redirect to login if trying to access protected route
        if (router.pathname !== '/login') {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
      if (router.pathname !== '/login') {
        router.push('/login')
      }
    }
    
    setLoading(false)
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
