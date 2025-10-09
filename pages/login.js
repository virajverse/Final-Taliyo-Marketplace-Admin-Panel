import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { simpleLogin } from '../lib/simpleAuth'

const Login = ({ user }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      router.push('/')
    }

    // Check for error from unauthorized access
    if (router.query.error === 'unauthorized') {
      setError('Access denied. You are not authorized to access this admin panel.')
    }
  }, [user, router])

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await simpleLogin(email, password)
      router.push('/')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">T</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Taliyo Admin</h1>
          <p className="text-gray-600 mt-2">Sign in to your admin panel</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert-error mb-6">
            <div className="flex items-start">
              <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleEmailLogin} className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="form-label">Email Address</label>
            <div className="relative">
              <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input pl-10"
                placeholder="admin@taliyo.com"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="form-label">Password</label>
            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input pl-10 pr-10"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <div className="loading-spinner mr-2"></div>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>



        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Only authorized administrators can access this panel</p>
          <p className="mt-2">© 2024 Taliyo Technologies</p>
        </div>
      </div>
    </div>
  )
}

export default Login
