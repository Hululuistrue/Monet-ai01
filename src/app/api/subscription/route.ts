import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sharedSubscriptionStore } from '@/lib/shared-subscription-store'
import Stripe from 'stripe'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// Lazy initialization to avoid build-time errors
function getStripeClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY
  if (!apiKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set')
  }
  return new Stripe(apiKey, {
    apiVersion: '2025-08-27.basil',
  })
}

// Static subscription plan data (consistent with plans API)
const SUBSCRIPTION_PLANS = [
  {
    id: '1',
    name: 'free',
    display_name: 'Free Plan',
    price: 0,
    currency: 'USD',
    billing_period: 'monthly',
    daily_generations: 3,
    hourly_limit: 2,
    max_batch_size: 1,
    features: [
      'Basic AI image generation',
      '3 generations per day',
      'Standard quality',
      'Community support'
    ],
    is_active: true
  },
  {
    id: '2',
    name: 'basic',
    display_name: 'Basic Plan',
    price: 9.99,
    currency: 'USD',
    billing_period: 'monthly',
    daily_generations: 100,
    hourly_limit: 20,
    max_batch_size: 4,
    features: [
      'Enhanced AI image generation',
      '100 generations per day',
      'High quality output',
      'Priority support',
      'Multiple styles available'
    ],
    is_active: true
  },
  {
    id: '3',
    name: 'pro',
    display_name: 'Pro Plan',
    price: 19.99,
    currency: 'USD',
    billing_period: 'monthly',
    daily_generations: 500,
    hourly_limit: 50,
    max_batch_size: 8,
    features: [
      'Premium AI image generation',
      '500 generations per day',
      'Ultra high quality',
      'Premium support',
      'All styles and models',
      'Commercial license',
      'API access'
    ],
    is_active: true
  }
]

// 获取用户当前订阅状态
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

    console.log(`[Main API] Fetching subscription for user: ${user.id}`)

    let subscriptionData = null

    try {
      // 1. 首先检查 Supabase 数据库中的订阅记录（优先级最高）
      const supabaseAdmin = getSupabaseAdmin()
      const { data: dbSubscription, error: dbError } = await supabaseAdmin
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            id,
            name,
            display_name,
            price,
            currency,
            daily_generations,
            hourly_limit,
            max_batch_size,
            features
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (dbSubscription && !dbError) {
        console.log('[Main API] Found database subscription:', dbSubscription)
        
        // 使用数据库中的订阅信息
        const plan = dbSubscription.subscription_plans
        subscriptionData = {
          userId: user.id,
          planName: plan.name,
          status: dbSubscription.status,
          subscribedAt: dbSubscription.created_at,
          sessionId: dbSubscription.subscription_id
        }

        // 缓存到内存
        sharedSubscriptionStore.set(user.id, subscriptionData)
        console.log('[Main API] Cached database subscription to memory')

        // 返回数据库中的完整订阅信息
        return NextResponse.json({
          success: true,
          data: {
            subscription_id: dbSubscription.subscription_id,
            plan: {
              id: plan.id,
              name: plan.name,
              display_name: plan.display_name,
              price: plan.price, // 价格已经是元单位
              currency: plan.currency?.toUpperCase() || 'USD',
              billing_period: 'monthly',
              daily_generations: plan.daily_generations,
              hourly_limit: plan.hourly_limit,
              max_batch_size: plan.max_batch_size,
              features: plan.features || [],
              is_active: true
            },
            status: dbSubscription.status,
            current_period_end: dbSubscription.current_period_end,
            cancel_at_period_end: dbSubscription.cancel_at_period_end || false,
            usage: {
              daily_used: 0,
              daily_remaining: plan.daily_generations,
              hourly_used: 0,
              hourly_remaining: plan.hourly_limit
            }
          }
        })
      } else {
        console.log('[Main API] No active database subscription found, error:', dbError?.message)
      }
    } catch (dbError) {
      console.error('[Main API] Database query failed:', dbError)
      // 继续检查其他存储方式
    }

    // 2. 检查共享内存存储
    const memoryData = sharedSubscriptionStore.get(user.id)
    console.log('[Main API] Memory data for user', user.id, ':', memoryData)
    
    if (memoryData) {
      subscriptionData = memoryData
    } 
    // 3. 检查用户 metadata
    else if (user.user_metadata?.subscription_plan) {
      const metadata = user.user_metadata
      console.log('[Main API] User metadata:', metadata)
      subscriptionData = {
        userId: user.id,
        planName: metadata.subscription_plan,
        status: metadata.subscription_status || 'active',
        subscribedAt: metadata.subscribed_at || new Date().toISOString(),
        sessionId: metadata.session_id
      }
      
      // 缓存到共享内存
      sharedSubscriptionStore.set(user.id, subscriptionData)
    }

    console.log('[Main API] Final subscription data:', subscriptionData)

    if (subscriptionData && subscriptionData.status === 'active') {
      // 用户有活跃订阅，返回对应的计划信息
      const plan = SUBSCRIPTION_PLANS.find(p => p.name === subscriptionData.planName)!
      
      return NextResponse.json({
        success: true,
        data: {
          subscription_id: subscriptionData.sessionId || 'subscription',
          plan: plan,
          status: subscriptionData.status,
          current_period_end: null,
          cancel_at_period_end: false,
          usage: {
            daily_used: 0,
            daily_remaining: plan.daily_generations,
            hourly_used: 0,
            hourly_remaining: plan.hourly_limit
          }
        }
      })
    } else {
      // 没有订阅，返回免费计划
      const freePlan = SUBSCRIPTION_PLANS.find(plan => plan.name === 'free')!
      
      return NextResponse.json({
        success: true,
        data: {
          subscription_id: null,
          plan: freePlan,
          status: 'free',
          current_period_end: null,
          cancel_at_period_end: false,
          usage: {
            daily_used: 0,
            daily_remaining: freePlan.daily_generations,
            hourly_used: 0,
            hourly_remaining: freePlan.hourly_limit
          }
        }
      })
    }

  } catch (error) {
    console.error('Subscription status API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// 创建订阅 (Stripe Checkout)
export async function POST(request: NextRequest) {
  console.log('POST /api/subscription called')
  
  try {
    const stripe = getStripeClient()
    
    const authHeader = request.headers.get('authorization')
    const body = await request.json()
    console.log('Request body:', body)
    
    const { plan_name, success_url, cancel_url } = body
    
    if (!authHeader) {
      console.log('No auth header provided')
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    console.log('Getting user from auth token...')
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      console.log('Auth error:', authError)
      return NextResponse.json({
        success: false,
        error: 'Invalid authentication'
      }, { status: 401 })
    }

    console.log('User authenticated:', user.email)

    // 获取订阅计划信息
    const plan = SUBSCRIPTION_PLANS.find(p => p.name === plan_name)
    console.log('Found plan:', plan)

    if (!plan) {
      console.log('Invalid plan name:', plan_name)
      return NextResponse.json({
        success: false,
        error: 'Invalid subscription plan'
      }, { status: 400 })
    }

    // 免费计划不需要支付
    if (plan.name === 'free') {
      return NextResponse.json({
        success: true,
        data: {
          checkout_url: success_url,
          session_id: 'free_plan'
        }
      })
    }

    console.log('Checking/creating Stripe customer...')
    // 创建 Stripe 客户（如果不存在）
    let customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    })

    if (customers.data.length > 0) {
      customer = customers.data[0]
      console.log('Found existing customer:', customer.id)
    } else {
      console.log('Creating new customer...')
      customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          user_id: user.id
        }
      })
      console.log('Created customer:', customer.id)
    }

    console.log('Creating checkout session...')
    // Create Checkout Session with English locale
    const successUrlWithPlan = `${success_url}?plan=${plan.name}`
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      locale: 'en', // Use 'en' instead of 'en-US'
      line_items: [{
        price_data: {
          currency: plan.currency.toLowerCase(),
          product_data: {
            name: plan.display_name,
            description: `${plan.daily_generations} generations per day`
          },
          unit_amount: Math.round(plan.price * 100), // Convert to cents
          recurring: {
            interval: plan.billing_period === 'yearly' ? 'year' : 'month'
          }
        },
        quantity: 1
      }],
      mode: 'subscription',
      success_url: successUrlWithPlan,
      cancel_url,
      metadata: {
        user_id: user.id,
        plan_id: plan.id,
        plan_name: plan.name
      },
      // Additional settings for English
      billing_address_collection: 'auto',
      payment_method_configuration: undefined // Let Stripe handle payment method config
    })

    console.log('Checkout session created:', session.id)
    console.log('Checkout URL:', session.url)

    return NextResponse.json({
      success: true,
      data: {
        checkout_url: session.url,
        session_id: session.id
      }
    })

  } catch (error) {
    console.error('Create subscription error:', error)
    
    // 提供更详细的错误信息
    let errorMessage = 'Failed to create subscription'
    if (error instanceof Error) {
      errorMessage = error.message
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 })
  }
}

// 取消订阅
export async function DELETE(request: NextRequest) {
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

    // 临时实现：由于没有数据库，返回成功但实际上没有订阅可取消
    return NextResponse.json({
      success: true,
      data: {
        message: 'No active subscription to cancel'
      }
    })

  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to cancel subscription'
    }, { status: 500 })
  }
}

// 重新激活订阅（取消取消操作）
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const { action } = await request.json()
    
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

    if (action === 'reactivate') {
      // 临时实现：由于没有数据库，返回成功但实际上没有订阅可重新激活
      return NextResponse.json({
        success: true,
        data: {
          message: 'No subscription to reactivate'
        }
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error) {
    console.error('Subscription management error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to manage subscription'
    }, { status: 500 })
  }
}