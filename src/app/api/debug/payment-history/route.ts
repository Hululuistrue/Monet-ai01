import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const authHeader = request.headers.get('authorization')
    
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

    // 检查各个表的状态
    const results: {
      user_id: string
      tables: Record<string, unknown>
      [key: string]: unknown
    } = {
      user_id: user.id,
      tables: {}
    }

    // 检查 subscription_plans 表
    try {
      const { data: plans, error: plansError } = await supabaseAdmin
        .from('subscription_plans')
        .select('*')
        .limit(5)
      
      results.tables.subscription_plans = {
        exists: !plansError,
        error: plansError?.message,
        count: plans?.length || 0,
        data: plans
      }
    } catch (e) {
      results.tables.subscription_plans = {
        exists: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      }
    }

    // 检查 user_subscriptions 表
    try {
      const { data: subscriptions, error: subsError } = await supabaseAdmin
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
      
      results.tables.user_subscriptions = {
        exists: !subsError,
        error: subsError?.message,
        count: subscriptions?.length || 0,
        data: subscriptions
      }
    } catch (e) {
      results.tables.user_subscriptions = {
        exists: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      }
    }

    // 检查 payment_history 表
    try {
      const { data: payments, error: paymentsError } = await supabaseAdmin
        .from('payment_history')
        .select('*')
        .eq('user_id', user.id)
      
      results.tables.payment_history = {
        exists: !paymentsError,
        error: paymentsError?.message,
        count: payments?.length || 0,
        data: payments
      }
    } catch (e) {
      results.tables.payment_history = {
        exists: false,
        error: e instanceof Error ? e.message : 'Unknown error'
      }
    }

    // 检查表结构
    try {
      const { data: tableInfo } = await supabaseAdmin
        .rpc('get_table_info', { table_name: 'payment_history' })
        .select()
      
      results.table_structure = tableInfo
    } catch {
      // 如果RPC不存在，尝试直接查询信息模式
      try {
        const { data: columns } = await supabaseAdmin
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', 'payment_history')
          .eq('table_schema', 'public')
        
        results.table_structure = columns
      } catch (e2) {
        results.table_structure_error = e2 instanceof Error ? e2.message : 'Cannot access table structure'
      }
    }

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      success: false,
      error: `Debug error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
}