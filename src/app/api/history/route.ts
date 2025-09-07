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

    // Get user's generated images
    const { data: images, error: dbError } = await supabase
      .from('generated_images')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (dbError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch history'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: images || []
    })

  } catch (error) {
    console.error('History API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}