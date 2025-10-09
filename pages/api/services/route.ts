import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabaseClient.js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    let query = supabase
      .from('services')
      .select(`
        *,
        category:categories(*),
        subcategory:subcategories(*)
      `)
      .eq('is_active', true)

    // Apply filters
    const category_id = searchParams.get('category_id')
    if (category_id) {
      query = query.eq('category_id', category_id)
    }

    const subcategory_id = searchParams.get('subcategory_id')
    if (subcategory_id) {
      query = query.eq('subcategory_id', subcategory_id)
    }

    const featured = searchParams.get('featured')
    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    query = query.order('created_at', { ascending: false })

    const limit = searchParams.get('limit')
    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const offset = searchParams.get('offset')
    if (offset) {
      query = query.range(parseInt(offset), parseInt(offset) + (parseInt(limit || '10')) - 1)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}