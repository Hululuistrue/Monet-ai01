import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sharedSubscriptionStore } from '@/lib/shared-subscription-store'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const { planName, sessionId } = await request.json()
    
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

    console.log(`[Update API] Processing subscription update for user ${user.id}: ${planName}`)

    // 存储订阅信息到共享内存
    const subscriptionData = {
      userId: user.id,
      planName,
      status: 'active',
      subscribedAt: new Date().toISOString(),
      sessionId
    }

    try {
      const supabaseAdmin = getSupabaseAdmin()
      
      // 1. 获取订阅计划信息
      const { data: plan, error: planError } = await supabaseAdmin
        .from('subscription_plans')
        .select('id, display_name, price')
        .eq('name', planName)
        .single()
      
      if (planError) {
        console.error('Failed to fetch plan:', planError)
        throw new Error(`Plan '${planName}' not found`)
      }
      
      console.log(`[Update API] Found plan:`, plan)
      
      // 2. 创建或更新用户订阅记录
      const subscriptionRecord = {
        user_id: user.id,
        subscription_id: sessionId || `dev_${Date.now()}`,
        plan_id: plan.id,
        status: 'active',
        cancel_at_period_end: false,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天后
      }
      
      // 先检查是否已存在订阅记录
      const { data: existingSubscription, error: selectError } = await supabaseAdmin
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      let userSubscriptionId: string
      
      if (existingSubscription && !selectError) {
        // 更新现有订阅
        const { data: updatedSubscription, error: updateError } = await supabaseAdmin
          .from('user_subscriptions')
          .update(subscriptionRecord)
          .eq('id', existingSubscription.id)
          .select('id')
          .single()
        
        if (updateError) {
          console.error('Failed to update subscription:', updateError)
          throw updateError
        }
        
        userSubscriptionId = updatedSubscription?.id || existingSubscription.id
        console.log(`[Update API] Updated existing subscription:`, userSubscriptionId)
      } else {
        // 创建新订阅
        const { data: newSubscription, error: insertError } = await supabaseAdmin
          .from('user_subscriptions')
          .insert(subscriptionRecord)
          .select('id')
          .single()
        
        if (insertError) {
          console.error('Failed to create subscription:', insertError)
          throw insertError
        }
        
        userSubscriptionId = newSubscription?.id
        console.log(`[Update API] Created new subscription:`, userSubscriptionId)
      }
      
      // 3. 创建支付历史记录（开发环境模拟）
      const paymentRecord = {
        user_id: user.id,
        subscription_id: userSubscriptionId,
        stripe_payment_intent_id: `pi_dev_${Date.now()}`,
        amount: plan.price,
        currency: 'usd',
        status: 'succeeded',
        payment_method: 'visa', // 开发环境模拟具体的卡片类型
        description: `Development subscription: ${plan.display_name}`,
        // 存储历史计划信息，确保支付历史显示正确的计划名称
        plan_name: planName,
        plan_display_name: plan.display_name,
        plan_price: plan.price
      }
      
      console.log('[Update API] Attempting to create payment record:', paymentRecord)
      
      const { data: paymentResult, error: paymentError } = await supabaseAdmin
        .from('payment_history')
        .insert(paymentRecord)
        .select()
      
      if (paymentError) {
        console.error('Failed to create payment record:', paymentError)
        console.error('Payment record that failed:', paymentRecord)
        // 不抛出错误，因为支付记录不是关键的，但我们需要记录详细错误
      } else {
        console.log(`[Update API] Successfully created payment record:`, paymentResult)
      }
      
      console.log(`[Update API] Successfully updated database for user ${user.id}`)
      
    } catch (dbError) {
      console.error('Database operation failed:', dbError)
      // 即使数据库操作失败，我们仍然可以继续使用内存存储
    }

    // 4. 存储到共享内存（开发环境快速访问）
    sharedSubscriptionStore.set(user.id, subscriptionData)
    console.log('[Update API] Stored subscription in memory for user', user.id, ':', subscriptionData)

    // 5. 尝试存储到 Supabase Auth metadata
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          subscription_plan: planName,
          subscription_status: 'active',
          subscribed_at: subscriptionData.subscribedAt,
          session_id: sessionId
        }
      })

      if (updateError) {
        console.error('Failed to update user metadata:', updateError)
      } else {
        console.log('Successfully updated user metadata for plan:', planName)
      }
    } catch (error) {
      console.error('Error updating metadata:', error)
    }

    console.log(`✅ [Update API] Subscription update completed for user ${user.id}: ${planName}`)

    return NextResponse.json({
      success: true,
      data: { message: 'Subscription updated successfully' }
    })

  } catch (error) {
    console.error('Update subscription error:', error)
    return NextResponse.json({
      success: false,
      error: `Failed to update subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 })
  }
}

// 获取存储的订阅状态
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

    // 1. 首先检查共享内存存储
    const memoryData = sharedSubscriptionStore.get(user.id)
    if (memoryData) {
      return NextResponse.json({
        success: true,
        data: memoryData
      })
    }

    // 2. 检查用户 metadata
    if (user.user_metadata?.subscription_plan) {
      const metadata = user.user_metadata
      const subscriptionData = {
        userId: user.id,
        planName: metadata.subscription_plan,
        status: metadata.subscription_status || 'active',
        subscribedAt: metadata.subscribed_at || new Date().toISOString(),
        sessionId: metadata.session_id
      }
      
      // 缓存到共享内存
      sharedSubscriptionStore.set(user.id, subscriptionData)
      
      return NextResponse.json({
        success: true,
        data: subscriptionData
      })
    }

    return NextResponse.json({
      success: true,
      data: null
    })

  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get subscription'
    }, { status: 500 })
  }
}