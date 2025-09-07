import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 简单的内存存储用于开发环境
interface SubscriptionData {
  userId: string
  planName: string
  status: string
  subscribedAt: string
  sessionId?: string
}

const subscriptionStore = new Map<string, SubscriptionData>()

// 静态订阅计划数据
const SUBSCRIPTION_PLANS = [
  {
    id: '1',
    name: 'free',
    display_name: 'Free Plan',
    price: 0,
    currency: 'USD',
    daily_generations: 3,
    hourly_limit: 2,
    max_batch_size: 1,
    features: ['Basic AI image generation', '3 generations per day', 'Standard quality', 'Community support']
  },
  {
    id: '2',
    name: 'basic',
    display_name: 'Basic Plan',
    price: 9.99,
    currency: 'USD',
    daily_generations: 100,
    hourly_limit: 20,
    max_batch_size: 4,
    features: ['Enhanced AI image generation', '100 generations per day', 'High quality output', 'Priority support', 'Multiple styles available']
  },
  {
    id: '3',
    name: 'pro',
    display_name: 'Pro Plan',
    price: 19.99,
    currency: 'USD',
    daily_generations: 500,
    hourly_limit: 50,
    max_batch_size: 8,
    features: ['Premium AI image generation', '500 generations per day', 'Ultra high quality', 'Premium support', 'All styles and models', 'Commercial license', 'API access']
  }
]

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

    let subscriptionData = null

    // 1. 首先检查内存存储
    const memoryData = subscriptionStore.get(user.id)
    if (memoryData) {
      subscriptionData = memoryData
    } 
    // 2. 检查用户 metadata
    else if (user.user_metadata?.subscription_plan) {
      const metadata = user.user_metadata
      subscriptionData = {
        userId: user.id,
        planName: metadata.subscription_plan,
        status: metadata.subscription_status || 'active',
        subscribedAt: metadata.subscribed_at || new Date().toISOString(),
        sessionId: metadata.session_id
      }
      
      // 缓存到内存
      subscriptionStore.set(user.id, subscriptionData)
    }

    if (subscriptionData && subscriptionData.status === 'active') {
      // 找到对应的计划
      const plan = SUBSCRIPTION_PLANS.find(p => p.name === subscriptionData.planName)
      
      if (plan) {
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
      }
    }

    // 如果没有活跃订阅，返回免费计划
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

  } catch (error) {
    console.error('Get subscription status error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get subscription status'
    }, { status: 500 })
  }
}