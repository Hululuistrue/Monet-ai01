import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
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

    console.log('Creating test data for user:', user.id)

    // 1. 确保用户有订阅计划
    const { data: proplan } = await supabaseAdmin
      .from('subscription_plans')
      .select('id')
      .eq('name', 'pro')
      .single()

    if (!proplan) {
      return NextResponse.json({
        success: false,
        error: 'Pro plan not found. Please run the database setup SQL first.'
      }, { status: 400 })
    }

    // 2. 创建或更新用户订阅
    const subscriptionData = {
      user_id: user.id,
      subscription_id: 'sub_test_' + Date.now(),
      plan_id: proplan.id,
      status: 'active',
      cancel_at_period_end: false,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }

    const { data: subscription, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert(subscriptionData, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select('id')
      .single()

    if (subError) {
      console.error('Subscription creation error:', subError)
      return NextResponse.json({
        success: false,
        error: `Failed to create subscription: ${subError.message}`
      }, { status: 500 })
    }

    console.log('Subscription created/updated:', subscription)

    // 3. 创建测试支付记录
    const testPayments = [
      {
        user_id: user.id,
        subscription_id: subscription.id,
        stripe_payment_intent_id: 'pi_test_' + Date.now() + '_1',
        stripe_charge_id: 'ch_test_' + Date.now() + '_1',
        amount: 2999, // $29.99 for Pro plan
        currency: 'usd',
        status: 'succeeded',
        payment_method: 'card',
        description: 'Upgrade to Pro Plan',
        receipt_url: 'https://stripe.com/receipt/test123'
      },
      {
        user_id: user.id,
        subscription_id: subscription.id,
        stripe_payment_intent_id: 'pi_test_' + (Date.now() - 86400000) + '_2', // Yesterday
        stripe_charge_id: 'ch_test_' + (Date.now() - 86400000) + '_2',
        amount: 999, // $9.99 for Basic plan (previous payment)
        currency: 'usd',
        status: 'succeeded',
        payment_method: 'card',
        description: 'Monthly subscription renewal',
        receipt_url: 'https://stripe.com/receipt/test456'
      }
    ]

    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('payment_history')
      .insert(testPayments)
      .select('*')

    if (paymentsError) {
      console.error('Payment creation error:', paymentsError)
      return NextResponse.json({
        success: false,
        error: `Failed to create payments: ${paymentsError.message}`
      }, { status: 500 })
    }

    console.log('Test payments created:', payments)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Test data created successfully',
        subscription: subscription,
        payments: payments,
        user_id: user.id
      }
    })

  } catch (error) {
    console.error('Create test data error:', error)
    return NextResponse.json({
      success: false,
      error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
}