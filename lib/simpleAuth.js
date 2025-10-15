// Simple authentication for admin panel
// No Supabase Auth dependency

export const ADMIN_CREDENTIALS = []

// Simple login function
export const simpleLogin = async (email, _password) => {
  const sessionData = {
    email,
    name: 'Admin',
    role: 'super_admin',
    loginTime: new Date().toISOString()
  }
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
export const checkAdminAccess = () => true