import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabaseClient.js'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        category:categories(*),
        subcategory:subcategories(*)
      `)
      .eq('id', params.id)
      .eq('is_active', true)
      .single()
    
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching service:', error)
    return NextResponse.json(
      { error: 'Service not found' },
      { status: 404 }
    )
  }
}