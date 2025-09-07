import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    
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

    console.log('Fetching payment history for user:', user.id)

    // 先检查数据库中是否存在 payment_history 表
    const { data: tableCheck } = await supabaseAdmin
      .from('payment_history')
      .select('id')
      .limit(1)
      .maybeSingle()
    
    console.log('Payment history table accessible:', !!tableCheck || tableCheck === null)

    // 查询支付历史，使用历史计划信息而不是当前订阅的计划信息
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('payment_history')
      .select(`
        id,
        user_id,
        subscription_id,
        stripe_payment_intent_id,
        stripe_charge_id,
        amount,
        currency,
        status,
        payment_method,
        description,
        receipt_url,
        created_at,
        plan_name,
        plan_display_name,
        plan_price
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (paymentsError) {
      console.error('Failed to fetch payment history:', paymentsError)
      return NextResponse.json({
        success: false,
        error: `Failed to fetch payment history: ${paymentsError.message}`
      }, { status: 500 })
    }

    console.log('Found payments:', payments?.length || 0)

    // 获取总数量用于分页
    const { count, error: countError } = await supabaseAdmin
      .from('payment_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      console.error('Failed to count payment history:', countError)
    }

    console.log('Total payment records for user:', count)

    return NextResponse.json({
      success: true,
      data: {
        payments: payments || [],
        total: count || 0,
        limit,
        offset,
        hasMore: count ? offset + limit < count : false
      }
    })

  } catch (error) {
    console.error('Payment history API error:', error)
    return NextResponse.json({
      success: false,
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
}