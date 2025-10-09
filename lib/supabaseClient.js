import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Use service role key for admin panel if available, otherwise anon key
const clientKey = supabaseServiceKey || supabaseAnonKey

// Client for admin operations with elevated permissions
export const supabase = createClient(supabaseUrl, clientKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Service client for admin operations (server-side only)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase
