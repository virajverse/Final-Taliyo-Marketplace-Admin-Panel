import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabaseClient.js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        service_id: body.service_id,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        customer_email: body.customer_email,
        message: body.message,
        preferred_date: body.preferred_date,
        preferred_time: body.preferred_time,
        special_requirements: body.special_requirements,
        status: 'pending'
      }])
      .select()
      .single()
    
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}