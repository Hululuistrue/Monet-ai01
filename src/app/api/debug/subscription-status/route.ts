import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sharedSubscriptionStore } from '@/lib/shared-subscription-store'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')
    
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid authentication'
      }, { status: 401 })
    }

    const targetUserId = userId || user.id

    // 1. 检查内存数据
    const memoryData = sharedSubscriptionStore.get(targetUserId)
    
    // 2. 检查数据库订阅
    const { data: dbSubscriptions, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select(`
        id, user_id, subscription_id, plan_id, status, 
        cancel_at_period_end, current_period_start, current_period_end, created_at,
        subscription_plans (
          id, name, display_name, price, daily_generations, hourly_limit, max_batch_size
        )
      `)
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })

    // 3. 检查支付历史
    const { data: payments, error: payError } = await supabaseAdmin
      .from('payment_history')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(5)

    // 4. 检查用户metadata
    const { data: userInfo, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    return NextResponse.json({
      success: true,
      debug_data: {
        user_id: targetUserId,
        timestamp: new Date().toISOString(),
        memory_data: memoryData || null,
        database_subscriptions: {
          count: dbSubscriptions?.length || 0,
          data: dbSubscriptions || [],
          error: subError?.message || null
        },
        payment_history: {
          count: payments?.length || 0,
          data: payments || [],
          error: payError?.message || null
        },
        user_metadata: userInfo?.user?.user_metadata || {},
        auth_error: userError?.message || null
      }
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      success: false,
      error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
}