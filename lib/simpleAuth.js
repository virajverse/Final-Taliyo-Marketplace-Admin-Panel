// Simple authentication for admin panel
// No Supabase Auth dependency

// Admin credentials from environment variables
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@taliyo.com'
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'changeThisPassword'
const ADMIN_NAME = process.env.NEXT_PUBLIC_ADMIN_NAME || process.env.ADMIN_NAME || 'Taliyo Admin'

export const ADMIN_CREDENTIALS = [
  {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    name: ADMIN_NAME,
    role: 'super_admin'
  }
]

// Simple login function
export const simpleLogin = async (email, password) => {
  // Find matching credentials
  const admin = ADMIN_CREDENTIALS.find(
    cred => cred.email === email && cred.password === password
  )
  
  if (!admin) {
    throw new Error('Invalid email or password')
  }
  
  // Create session data
  const sessionData = {
    email: admin.email,
    name: admin.name,
    role: admin.role,
    loginTime: new Date().toISOString()
  }
  
  // Store in localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_session', JSON.stringify(sessionData))
  }
  
  return sessionData
}

// Check if user is logged in
export const checkSession = () => {
  if (typeof window === 'undefined') return null
  
  try {
    const session = localStorage.getItem('admin_session')
    if (!session) return null
    
    const sessionData = JSON.parse(session)
    
    // Check if session is still valid (24 hours)
    const loginTime = new Date(sessionData.loginTime)
    const now = new Date()
    const hoursDiff = (now - loginTime) / (1000 * 60 * 60)
    
    if (hoursDiff > 24) {
      localStorage.removeItem('admin_session')
      return null
    }
    
    return sessionData
  } catch (error) {
    localStorage.removeItem('admin_session')
    return null
  }
}

// Logout function
export const simpleLogout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_session')
  }
}

// Check admin access
export const checkAdminAccess = (email) => {
  return ADMIN_CREDENTIALS.some(cred => cred.email === email)
}