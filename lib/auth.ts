import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create Supabase client with service role for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// JWT Secret for admin authentication
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

export interface AdminUser {
  id: string
  email: string
  name?: string
  role: 'admin' | 'super_admin'
  is_active: boolean
}

// Generate JWT token for admin
export function generateAdminToken(admin: AdminUser): string {
  return jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      type: 'admin'
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  )
}

// Verify JWT token
export function verifyAdminToken(token: string): AdminUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    if (decoded.type !== 'admin') {
      return null
    }

    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      is_active: true
    }
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

// Extract admin from request
export async function getAdminFromRequest(request: NextRequest): Promise<AdminUser | null> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    const adminData = verifyAdminToken(token)
    
    if (!adminData) {
      return null
    }

    // Verify admin exists and is active in database
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', adminData.email)
      .eq('is_active', true)
      .single()

    if (error || !admin) {
      return null
    }

    // Update last login
    await supabaseAdmin
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id)

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      is_active: admin.is_active
    }
  } catch (error) {
    console.error('Error getting admin from request:', error)
    return null
  }
}

// Middleware to protect admin routes
export async function requireAdmin(request: NextRequest): Promise<AdminUser | Response> {
  const admin = await getAdminFromRequest(request)
  
  if (!admin) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Admin access required.' }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  return admin
}

// Middleware to require super admin
export async function requireSuperAdmin(request: NextRequest): Promise<AdminUser | Response> {
  const admin = await getAdminFromRequest(request)
  
  if (!admin) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized. Admin access required.' }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  if (admin.role !== 'super_admin') {
    return new Response(
      JSON.stringify({ error: 'Forbidden. Super admin access required.' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  return admin
}

// Admin login function
export async function loginAdmin(email: string, password: string): Promise<{ admin: AdminUser; token: string } | null> {
  try {
    // Simple password check - use proper password hashing in production
    const ADMIN_PASSWORDS: { [key: string]: string } = {
      'admin@taliyotechnologies.com': 'admin123',
      'manager@taliyotechnologies.com': 'manager123'
    }

    if (!ADMIN_PASSWORDS[email] || ADMIN_PASSWORDS[email] !== password) {
      return null
    }

    // Get admin from database
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (error || !admin) {
      return null
    }

    const adminUser: AdminUser = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      is_active: admin.is_active
    }

    const token = generateAdminToken(adminUser)

    // Update last login
    await supabaseAdmin
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id)

    return { admin: adminUser, token }
  } catch (error) {
    console.error('Admin login error:', error)
    return null
  }
}

// Check if email is allowed admin
export const ALLOWED_ADMIN_EMAILS = [
  'admin@taliyotechnologies.com',
  'manager@taliyotechnologies.com'
]

export function isAllowedAdminEmail(email: string): boolean {
  return ALLOWED_ADMIN_EMAILS.includes(email.toLowerCase())
}