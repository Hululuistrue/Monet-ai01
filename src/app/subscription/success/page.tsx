'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2, ArrowRight, Crown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function SubscriptionSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const planName = searchParams.get('plan') // 从URL获取计划名称
  
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<{
    subscription_id: string
    plan: {
      id: string
      name: string
      display_name: string
      daily_generations: number
      max_batch_size: number
    }
    status: string
  } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkPaymentStatus = async () => {
      // 在开发环境中，暂时跳过 session_id 验证
      const isDevEnvironment = process.env.NODE_ENV === 'development'
      
      if (!sessionId && !isDevEnvironment) {
        setError('Invalid session')
        setLoading(false)
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/auth/login?redirect=/subscription/success')
          return
        }

        // 在开发环境下，如果有planName参数，直接更新订阅状态
        if (isDevEnvironment && planName) {
          console.log('Development environment detected, updating subscription for plan:', planName)
          
          // 直接调用更新 API 来设置订阅状态
          try {
            const response = await fetch('/api/subscription/update', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                planName,
                sessionId: sessionId || `dev_${Date.now()}`
              })
            })

            const result = await response.json()
            console.log('Update API response:', result)

            if (response.ok) {
              console.log('Subscription updated successfully')
            } else {
              console.error('Failed to update subscription via API:', result)
            }
          } catch (error) {
            console.error('Failed to update subscription:', error)
          }

          const mockPlans = {
            basic: {
              id: '2',
              name: 'basic',
              display_name: 'Basic Plan',
              daily_generations: 100,
              max_batch_size: 4,
              features: ['Enhanced AI image generation', '100 generations per day', 'High quality output', 'Priority support']
            },
            pro: {
              id: '3',
              name: 'pro',
              display_name: 'Pro Plan',
              daily_generations: 500,
              max_batch_size: 8,
              features: ['Premium AI image generation', '500 generations per day', 'Ultra high quality', 'Premium support', 'All styles and models']
            }
          }

          const mockPlan = mockPlans[planName as keyof typeof mockPlans]
          if (mockPlan) {
            setSubscription({
              subscription_id: 'dev_' + Date.now(),
              plan: mockPlan,
              status: 'active',
              usage: {
                daily_used: 0,
                daily_remaining: mockPlan.daily_generations,
                hourly_used: 0,
                hourly_remaining: 20
              }
            } as any)
            setLoading(false)
            return
          }
        }

        // Wait a moment for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Fetch updated subscription info
        const response = await fetch('/api/subscription', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        const result = await response.json()
        
        if (result.success) {
          setSubscription(result.data)
        } else {
          setError('Failed to fetch subscription details')
        }
      } catch (err) {
        console.error('Error checking payment status:', err)
        setError('Something went wrong')
      } finally {
        setLoading(false)
      }
    }

    checkPaymentStatus()
  }, [sessionId, planName, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing your payment...</h2>
          <p className="text-gray-600">Please wait while we confirm your subscription.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/subscription"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Try Again
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Welcome to your new subscription plan. You can now enjoy enhanced features and higher generation limits.
        </p>

        {subscription && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center mb-4">
              <Crown className="w-6 h-6 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-purple-900">
                {subscription.plan.display_name || subscription.plan.name}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Daily Generations:</span>
                <div className="font-semibold">{subscription.plan.daily_generations}</div>
              </div>
              <div>
                <span className="text-gray-600">Batch Size:</span>
                <div className="font-semibold">Up to {subscription.plan.max_batch_size}</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Link 
            href="/generate"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all"
          >
            Start Generating Images
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          
          <Link 
            href="/subscription"
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            Check Subscription Status
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            A receipt has been sent to your email address. You can manage your subscription anytime from your account settings.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
        </div>
      </div>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  )
}