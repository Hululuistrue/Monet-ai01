import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid authentication'
      }, { status: 401 })
    }

    // For now, return mock data since DB tables aren't set up yet
    const mockCredits = {
      daily_used: Math.floor(Math.random() * 10),
      daily_limit: 50,
      daily_remaining: 50 - Math.floor(Math.random() * 10),
      total_generated: Math.floor(Math.random() * 100),
      reset_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }

    return NextResponse.json({
      success: true,
      data: mockCredits
    })

  } catch (error) {
    console.error('Credits API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}