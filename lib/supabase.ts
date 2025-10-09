import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  slug: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Subcategory {
  id: string
  category_id: string
  name: string
  description?: string
  slug: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  title: string
  description?: string
  category_id?: string
  subcategory_id?: string
  price_min?: number
  price_max?: number
  price_type: 'fixed' | 'hourly' | 'negotiable'
  duration_minutes?: number
  location?: string
  is_remote: boolean
  images: string[]
  provider_name?: string
  provider_avatar?: string
  provider_bio?: string
  provider_phone?: string
  provider_verified: boolean
  rating_average: number
  rating_count: number
  is_active: boolean
  is_featured: boolean
  slug?: string
  meta_title?: string
  meta_description?: string
  created_at: string
  updated_at: string
  // Relations
  category?: Category
  subcategory?: Subcategory
}

export interface Booking {
  id: string
  service_id: string
  customer_name?: string
  customer_phone: string
  customer_email?: string
  message?: string
  preferred_date?: string
  preferred_time?: string
  special_requirements?: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  taliyo_response?: string
  quoted_price?: number
  final_price?: number
  created_at: string
  updated_at: string
  confirmed_at?: string
  completed_at?: string
  // Relations
  service?: Service
}

export interface Review {
  id: string
  service_id: string
  booking_id?: string
  customer_name: string
  rating: number
  review_text?: string
  is_approved: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
  // Relations
  service?: Service
}

export interface Analytics {
  id: string
  service_id?: string
  event_type: 'view' | 'click' | 'whatsapp_click' | 'call_click'
  user_ip?: string
  user_agent?: string
  referrer?: string
  country?: string
  city?: string
  created_at: string
  // Relations
  service?: Service
}

export interface Admin {
  id: string
  email: string
  name?: string
  role: 'admin' | 'super_admin'
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

export interface Setting {
  id: string
  key: string
  value: any
  description?: string
  created_at: string
  updated_at: string
}

// API Functions
export const api = {
  // Categories
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    
    if (error) throw error
    return data as Category[]
  },

  async getCategoryWithSubcategories(slug: string) {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        subcategories (*)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    
    if (error) throw error
    return data
  },

  // Services
  async getServices(params?: {
    category_id?: string
    subcategory_id?: string
    is_featured?: boolean
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('services')
      .select(`
        *,
        category:categories(*),
        subcategory:subcategories(*)
      `)
      .eq('is_active', true)

    if (params?.category_id) {
      query = query.eq('category_id', params.category_id)
    }

    if (params?.subcategory_id) {
      query = query.eq('subcategory_id', params.subcategory_id)
    }

    if (params?.is_featured) {
      query = query.eq('is_featured', true)
    }

    query = query.order('created_at', { ascending: false })

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data as Service[]
  },

  async getService(id: string) {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        category:categories(*),
        subcategory:subcategories(*)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()
    
    if (error) throw error
    return data as Service
  },

  async getServiceBySlug(slug: string) {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        category:categories(*),
        subcategory:subcategories(*)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()
    
    if (error) throw error
    return data as Service
  },

  async searchServices(query: string) {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        category:categories(*),
        subcategory:subcategories(*)
      `)
      .eq('is_active', true)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('rating_average', { ascending: false })
    
    if (error) throw error
    return data as Service[]
  },

  // Bookings
  async createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('bookings')
      .insert([booking])
      .select()
      .single()
    
    if (error) throw error
    return data as Booking
  },

  async getBookings(params?: {
    status?: string
    limit?: number
    offset?: number
  }) {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        service:services(*)
      `)

    if (params?.status) {
      query = query.eq('status', params.status)
    }

    query = query.order('created_at', { ascending: false })

    if (params?.limit) {
      query = query.limit(params.limit)
    }

    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data as Booking[]
  },

  // Reviews
  async getReviews(service_id?: string) {
    let query = supabase
      .from('reviews')
      .select('*')
      .eq('is_approved', true)

    if (service_id) {
      query = query.eq('service_id', service_id)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    
    if (error) throw error
    return data as Review[]
  },

  async createReview(review: Omit<Review, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('reviews')
      .insert([review])
      .select()
      .single()
    
    if (error) throw error
    return data as Review
  },

  // Analytics
  async trackEvent(event: Omit<Analytics, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('analytics')
      .insert([event])
      .select()
      .single()
    
    if (error) throw error
    return data as Analytics
  },

  async getAnalytics(params?: {
    service_id?: string
    event_type?: string
    start_date?: string
    end_date?: string
  }) {
    let query = supabase
      .from('analytics')
      .select('*')

    if (params?.service_id) {
      query = query.eq('service_id', params.service_id)
    }

    if (params?.event_type) {
      query = query.eq('event_type', params.event_type)
    }

    if (params?.start_date) {
      query = query.gte('created_at', params.start_date)
    }

    if (params?.end_date) {
      query = query.lte('created_at', params.end_date)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    
    if (error) throw error
    return data as Analytics[]
  },

  // Settings
  async getSettings() {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
    
    if (error) throw error
    return data as Setting[]
  },

  async getSetting(key: string) {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', key)
      .single()
    
    if (error) throw error
    return data as Setting
  }
}

export default supabase