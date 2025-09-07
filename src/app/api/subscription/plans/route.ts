import { NextRequest, NextResponse } from 'next/server'

// 静态订阅计划数据
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

// 获取所有订阅计划
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: SUBSCRIPTION_PLANS
    })
  } catch (error) {
    console.error('Subscription plans API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}