'use client'

import { useState, useEffect } from 'react'
import { Crown, Check, Loader2, CreditCard, Star, Zap, Shield, AlertTriangle, RotateCcw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface SubscriptionPlan {
  id: string
  name: string
  display_name: string
  price: number
  currency: string
  daily_generations: number
  hourly_limit: number
  max_batch_size: number
  features: string[]
}

interface UserSubscription {
  subscription_id: string | null
  plan: SubscriptionPlan | null
  status: string
  current_period_end: string | null
  cancel_at_period_end?: boolean
  usage: {
    daily_used: number
    daily_remaining: number
    hourly_used: number
    hourly_remaining: number
  }
}

interface PricingCardProps {
  plan: SubscriptionPlan
  currentSubscription: UserSubscription | null
  onSelectPlan: (planName: string) => void
  loading: boolean
  isPreselected?: boolean
}

function PricingCard({ plan, currentSubscription, onSelectPlan, loading, isPreselected }: PricingCardProps) {
  const isCurrentPlan = currentSubscription?.plan?.name === plan.name
  const isFree = plan.name === 'free'
  const isPopular = plan.name === 'basic'
  
  // 定义计划层级，防止降级
  const getPlanLevel = (planName: string): number => {
    switch (planName) {
      case 'free': return 0
      case 'basic': return 1
      case 'pro': return 2
      default: return -1
    }
  }
  
  const currentPlanLevel = getPlanLevel(currentSubscription?.plan?.name || 'free')
  const thisPlanLevel = getPlanLevel(plan.name)
  const isDowngrade = thisPlanLevel < currentPlanLevel
  const isUpgrade = thisPlanLevel > currentPlanLevel

  // 添加调试信息
  console.log('PricingCard debug:', {
    planName: plan.name,
    currentPlanName: currentSubscription?.plan?.name,
    currentPlanLevel,
    thisPlanLevel,
    isCurrentPlan,
    isDowngrade,
    isUpgrade,
    loading,
    disabled: isCurrentPlan || loading || isDowngrade
  })
  
  const getPlanIcon = () => {
    switch (plan.name) {
      case 'free': return <Star className="w-6 h-6" />
      case 'basic': return <Zap className="w-6 h-6" />
      case 'pro': return <Crown className="w-6 h-6" />
      default: return <Shield className="w-6 h-6" />
    }
  }

  const getPlanColor = () => {
    if (isPreselected) return 'border-orange-300 hover:border-orange-400 ring-2 ring-orange-200 bg-orange-50'
    switch (plan.name) {
      case 'free': return 'border-gray-200 hover:border-gray-300'
      case 'basic': return 'border-purple-200 hover:border-purple-300 ring-2 ring-purple-100'
      case 'pro': return 'border-yellow-200 hover:border-yellow-300 ring-2 ring-yellow-100'
      default: return 'border-gray-200 hover:border-gray-300'
    }
  }

  const getButtonStyle = () => {
    if (isCurrentPlan) return 'bg-gray-100 text-gray-600 cursor-not-allowed'
    if (isDowngrade) return 'bg-red-50 text-red-400 cursor-not-allowed border border-red-200'
    if (isFree) return 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white'
    if (plan.name === 'pro') return 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
    if (plan.name === 'basic') return 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
    return 'bg-gray-900 hover:bg-gray-800 text-white'
  }

  return (
    <div className={`relative bg-white rounded-2xl shadow-lg p-6 transition-all duration-200 ${getPlanColor()}`}>
      {isPopular && !isPreselected && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      
      {isPreselected && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            Recommended for You
          </span>
        </div>
      )}

      {isDowngrade && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Cannot Downgrade
          </span>
        </div>
      )}
      
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className={`p-3 rounded-full ${plan.name === 'pro' ? 'bg-yellow-100 text-yellow-600' : plan.name === 'basic' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
            {getPlanIcon()}
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.display_name}</h3>
        
        <div className="mb-6">
          <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
          {!isFree && <span className="text-gray-500 ml-1">/month</span>}
        </div>

        <div className="space-y-4 mb-8">
          <div className="text-sm text-gray-600">
            <strong>{plan.daily_generations}</strong> generations per day
          </div>
          <div className="text-sm text-gray-600">
            Up to <strong>{plan.max_batch_size}</strong> images per generation
          </div>
          <div className="text-sm text-gray-600">
            <strong>{plan.hourly_limit}</strong> generations per hour
          </div>
        </div>

        <ul className="space-y-3 mb-8">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-gray-600">
              <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>

        <button
          onClick={() => {
            console.log('Button clicked for plan:', plan.name)
            onSelectPlan(plan.name)
          }}
          disabled={isCurrentPlan || loading || isDowngrade}
          className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${getButtonStyle()}`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : isDowngrade ? (
            <div className="flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Downgrade Not Allowed
            </div>
          ) : isFree ? (
            'Get Started Free'
          ) : isUpgrade ? (
            'Upgrade Now'
          ) : (
            'Select Plan'
          )}
        </button>
      </div>
    </div>
  )
}

interface SubscriptionManagerProps {
  user: User | null
  selectedPlan?: string | null
}

export default function SubscriptionManager({ user, selectedPlan }: SubscriptionManagerProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [managing, setManaging] = useState(false)

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  // 移除自动选择逻辑，让用户手动点击升级按钮
  // useEffect(() => {
  //   if (selectedPlan && plans.length > 0 && currentSubscription && currentSubscription.plan && !loading && !upgrading) {
  //     // 如果用户当前是免费计划且有预选计划，自动触发计划选择
  //     if (currentSubscription.plan.name === 'free') {
  //       handleSelectPlan(selectedPlan)
  //     }
  //   }
  // }, [selectedPlan, plans, currentSubscription, loading, upgrading])

  const fetchData = async () => {
    try {
      // 获取所有计划
      const plansResponse = await fetch('/api/subscription/plans')
      const plansResult = await plansResponse.json()
      
      if (plansResult.success) {
        setPlans(plansResult.data)
      }

      // 获取用户当前订阅
      if (user) {
        console.log('Fetching subscription for user:', user.id)
        
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const subResponse = await fetch('/api/subscription', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          })
          const subResult = await subResponse.json()
          
          console.log('Subscription API response:', subResult)
          
          if (subResult.success) {
            setCurrentSubscription(subResult.data)
            console.log('Set current subscription to:', subResult.data)
          } else {
            console.error('Subscription API error:', subResult.error)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = async (planName: string) => {
    console.log('handleSelectPlan called with:', planName)
    
    if (!user) {
      console.log('No user found')
      return
    }

    if (planName === 'free') {
      // For free plan, just redirect to generate page
      window.location.href = '/generate'
      return
    }

    console.log('Starting upgrade process for plan:', planName)
    setUpgrading(true)
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('Session result:', { session: !!session, error: sessionError })
      
      if (!session) {
        console.log('No session found')
        alert('Please log in again to continue')
        setUpgrading(false)
        return
      }

      console.log('Making API request to create subscription...')
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          plan_name: planName,
          success_url: `${window.location.origin}/subscription/success`,
          cancel_url: `${window.location.origin}/subscription/cancel`
        })
      })

      console.log('API response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const result = await response.json()
      console.log('API response result:', result)
      
      if (result.success && result.data.checkout_url) {
        console.log('Redirecting to checkout URL:', result.data.checkout_url)
        window.location.href = result.data.checkout_url
      } else {
        console.error('API returned success=false or no checkout_url:', result)
        alert('Failed to create subscription: ' + (result.error || 'Unknown error') + 
              (result.details ? '\nDetails: ' + JSON.stringify(result.details) : ''))
      }
    } catch (error) {
      console.error('Failed to create subscription:', error)
      alert('An error occurred while creating subscription. Please try again.')
    } finally {
      setUpgrading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!user || !currentSubscription?.subscription_id) return

    setManaging(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/subscription', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()
      
      if (result.success) {
        await fetchData() // Refresh subscription data
        alert('Your subscription will be cancelled at the end of the current billing period.')
      } else {
        alert('Failed to cancel subscription: ' + result.error)
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
      alert('Something went wrong while cancelling your subscription.')
    } finally {
      setManaging(false)
    }
  }

  const handleReactivateSubscription = async () => {
    if (!user || !currentSubscription?.subscription_id) return

    setManaging(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/subscription', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'reactivate' })
      })

      const result = await response.json()
      
      if (result.success) {
        await fetchData() // Refresh subscription data
        alert('Your subscription has been reactivated!')
      } else {
        alert('Failed to reactivate subscription: ' + result.error)
      }
    } catch (error) {
      console.error('Failed to reactivate subscription:', error)
      alert('Something went wrong while reactivating your subscription.')
    } finally {
      setManaging(false)
    }
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Please sign in to view subscription plans</h2>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Section 1: Current Plan & Usage */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Current Plan & Usage</h2>
          <p className="text-lg text-gray-600">Your subscription status and usage overview</p>
        </div>

        {currentSubscription && currentSubscription.plan ? (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Active Subscription</h3>
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <span className="text-lg font-semibold text-purple-600">{currentSubscription.plan.display_name}</span>
                  {currentSubscription.cancel_at_period_end && (
                    <div className="flex items-center space-x-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Cancelling</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  ${currentSubscription.plan.price}
                  {currentSubscription.plan.name !== 'free' && <span className="text-sm text-gray-500 font-normal">/month</span>}
                </div>
                <div className="text-sm text-gray-600">
                  {currentSubscription.plan.daily_generations} generations/day
                </div>
              </div>
            </div>
            
            {/* Usage Statistics */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-xl p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Daily Usage</h4>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{currentSubscription.usage.daily_used} / {currentSubscription.plan.daily_generations}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(100, (currentSubscription.usage.daily_used / currentSubscription.plan.daily_generations) * 100)}%` 
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  {currentSubscription.usage.daily_remaining} generations remaining today
                </p>
              </div>

              <div className="bg-white rounded-xl p-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Plan Features</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Max batch size</span>
                    <span className="font-medium">{currentSubscription.plan.max_batch_size}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Hourly limit</span>
                    <span className="font-medium">{currentSubscription.plan.hourly_limit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <span className="font-medium text-green-600">Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Management */}
            {currentSubscription.subscription_id && currentSubscription.plan.name !== 'free' && (
              <div className="bg-white rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Subscription Management</h4>
                <div className="flex flex-wrap gap-3">
                  {currentSubscription.cancel_at_period_end ? (
                    <button
                      onClick={handleReactivateSubscription}
                      disabled={managing}
                      className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
                    >
                      {managing ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <RotateCcw className="w-4 h-4 mr-2" />
                      )}
                      Reactivate Subscription
                    </button>
                  ) : (
                    <button
                      onClick={handleCancelSubscription}
                      disabled={managing}
                      className="flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
                    >
                      {managing ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 mr-2" />
                      )}
                      Cancel Subscription
                    </button>
                  )}
                </div>
                {currentSubscription.cancel_at_period_end && currentSubscription.current_period_end && (
                  <p className="text-sm text-orange-700 mt-3 p-3 bg-orange-50 rounded-lg">
                    <AlertTriangle className="w-4 h-4 inline mr-2" />
                    Your subscription will end on {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-8 max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Subscription</h3>
            <p className="text-gray-600 mb-6">You're currently on the free plan with limited features.</p>
            <div className="bg-white rounded-xl p-4 inline-block">
              <div className="text-sm text-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <span>Daily generations</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Max batch size</span>
                  <span className="font-medium">1</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Choose Your Plan */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
          <p className="text-lg text-gray-600">Upgrade to unlock more creativity and advanced features</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                currentSubscription={currentSubscription}
                onSelectPlan={handleSelectPlan}
                loading={upgrading}
                isPreselected={selectedPlan === plan.name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}