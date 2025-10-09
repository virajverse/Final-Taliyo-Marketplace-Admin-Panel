import { supabase } from './supabaseClient'

// List of allowed admin emails (Super Admins)
export const ALLOWED_ADMIN_EMAILS = [
  'taliyotechnologies@gmail.com'  // Main Super Admin
]

export const signInWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  
  // Check if email is in allowed list
  if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
    await supabase.auth.signOut()
    throw new Error('Access denied. You are not authorized to access this admin panel.')
  }
  
  return data
}

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user && !ALLOWED_ADMIN_EMAILS.includes(user.email)) {
    await signOut()
    throw new Error('Access denied')
  }
  
  return user
}

export const checkAdminAccess = async (email) => {
  // First check if email is in hardcoded list
  if (ALLOWED_ADMIN_EMAILS.includes(email)) {
    return true
  }
  
  // Then check database for additional admins
  const { data, error } = await supabase
    .from('admins')
    .select('email')
    .eq('email', email)
    .eq('is_active', true)
    .single()
  
  return !error && data
}
