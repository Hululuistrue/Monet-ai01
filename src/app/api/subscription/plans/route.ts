import { NextResponse } from 'next/server'

// 静态订阅计划数据 - 按照权限控制要求调整
const SUBSCRIPTION_PLANS = [
  {
    id: '0',
    name: 'guest',
    display_name: 'Guest User',
    price: 0,
    currency: 'USD',
    billing_period: 'daily',
    daily_generations: 3,
    hourly_limit: 2,
    max_batch_size: 2,
    max_downloads: 1,
    quality: 'standard',
    features: [
      '3 generations per day',
      'Generate up to 2 images at once',
      'Download 1 image per generation',
      'Standard quality',
      'Device-based tracking'
    ],
    is_active: true
  },
  {
    id: '1',
    name: 'free',
    display_name: 'Free Plan',
    price: 0,
    currency: 'USD',
    billing_period: 'monthly',
    daily_generations: 10,
    hourly_limit: 2,
    max_batch_size: 2,
    max_downloads: 2,
    quality: 'standard',
    features: [
      '10 generations per day',
      'Generate up to 2 images at once',
      'Download 2 images per generation',
      'Standard quality',
      'Email verification required',
      'Save generation history'
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
    daily_generations: 50,
    hourly_limit: 10,
    max_batch_size: 4,
    max_downloads: 4,
    quality: 'hd',
    queue_priority: 'standard',
    features: [
      '50 generations per day',
      'Generate up to 4 images at once',
      'Download all generated images',
      'High-definition quality',
      'Standard processing queue',
      'Priority support'
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
    daily_generations: 200,
    hourly_limit: 20,
    max_batch_size: 6,
    max_downloads: 6,
    quality: 'hd',
    queue_priority: 'high',
    features: [
      '200 generations per day',
      'Generate up to 6 images at once',
      'Download all generated images',
      'High-definition quality',
      'Priority processing queue',
      'New model early access',
      'Batch generation support',
      'Commercial license',
      'Premium support'
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