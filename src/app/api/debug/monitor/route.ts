import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const authHeader = request.headers.get('authorization')
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')
    
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

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

    // 获取用户订阅信息
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (
          name,
          display_name,
          price
        )
      `)
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })

    // 获取支付历史
    const { data: payments, error: payError } = await supabaseAdmin
      .from('payment_history')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(5)

    // 获取订阅计划列表
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .order('name')

    return NextResponse.json({
      success: true,
      data: {
        user_id: targetUserId,
        timestamp: new Date().toISOString(),
        subscriptions: {
          count: subscriptions?.length || 0,
          data: subscriptions || [],
          error: subError?.message
        },
        payments: {
          count: payments?.length || 0,
          data: payments || [],
          error: payError?.message
        },
        plans: {
          count: plans?.length || 0,
          data: plans || [],
          error: plansError?.message
        }
      }
    })

  } catch (error) {
    console.error('Monitor API error:', error)
    return NextResponse.json({
      success: false,
      error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
}