import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  console.log('=== Payment History Simple API Called ===')
  
  try {
    const authHeader = request.headers.get('authorization')
    console.log('Auth header present:', !!authHeader)
    
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    console.log('Supabase admin client created')

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    console.log('User authentication result:', { 
      userId: user?.id, 
      error: authError?.message 
    })

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid authentication'
      }, { status: 401 })
    }

    // 简单查询，不加任何连接
    console.log('Attempting simple payment_history query...')
    
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('payment_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    console.log('Payment query result:', {
      paymentsCount: payments?.length || 0,
      error: paymentsError?.message,
      payments: payments
    })

    if (paymentsError) {
      console.error('Payment query error:', paymentsError)
      
      // 如果表不存在，返回特定错误
      if (paymentsError.message?.includes('relation') && paymentsError.message?.includes('does not exist')) {
        return NextResponse.json({
          success: false,
          error: 'Database tables not created. Please run the setup SQL first.',
          setup_needed: true
        }, { status: 400 })
      }
      
      return NextResponse.json({
        success: false,
        error: `Database error: ${paymentsError.message}`
      }, { status: 500 })
    }

    // 如果有数据，尝试获取订阅信息
    let paymentsWithPlans = payments
    if (payments && payments.length > 0) {
      console.log('Attempting to fetch subscription details...')
      
      for (let payment of payments) {
        if (payment.subscription_id) {
          const { data: subscription } = await supabaseAdmin
            .from('user_subscriptions')
            .select(`
              id,
              subscription_plans (
                display_name,
                name
              )
            `)
            .eq('id', payment.subscription_id)
            .single()
          
          if (subscription) {
            payment.user_subscriptions = subscription
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        payments: paymentsWithPlans || [],
        total: payments?.length || 0,
        limit: 10,
        offset: 0,
        hasMore: false
      }
    })

  } catch (error) {
    console.error('=== Simple Payment History API Error ===', error)
    return NextResponse.json({
      success: false,
      error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}