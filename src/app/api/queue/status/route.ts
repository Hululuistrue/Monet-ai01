import { NextRequest, NextResponse } from 'next/server'
import { getQueueStatus } from '@/utils/queueManager'
import { getPlanLimits } from '@/utils/rateLimit'
import { supabase } from '@/lib/supabase'
import { getUserSubscriptionInfo } from '@/lib/subscription'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    let userPlan = 'guest'

    // Determine user plan
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
      if (user) {
        const subscriptionInfo = await getUserSubscriptionInfo(user.id)
        userPlan = subscriptionInfo.planName
      }
    }

    const queueStatus = getQueueStatus(userPlan)
    const planLimits = getPlanLimits(userPlan)

    return NextResponse.json({
      success: true,
      data: {
        userPlan,
        queuePosition: queueStatus.position,
        estimatedWaitTime: queueStatus.estimatedWaitTime,
        planLimits,
        queueStats: queueStatus.stats,
        recommendations: getRecommendations(userPlan, queueStatus.stats)
      }
    })

  } catch (error) {
    console.error('Queue status API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

function getRecommendations(userPlan: string, stats: any): string[] {
  const recommendations: string[] = []

  // Queue-based recommendations
  if (stats.waiting > 10) {
    if (userPlan === 'guest' || userPlan === 'free') {
      recommendations.push('💎 Upgrade to Basic or Pro plan for priority processing')
    }
    recommendations.push('⏰ Peak usage detected. Consider generating images during off-peak hours')
  }

  // Plan-based recommendations  
  if (userPlan === 'guest') {
    recommendations.push('📧 Sign up for a free account to get more generations and save your artwork')
    recommendations.push('🎨 Create an account to access higher quality images')
  } else if (userPlan === 'free') {
    recommendations.push('⚡ Upgrade to Basic plan for 5x more generations and HD quality')
    recommendations.push('🚀 Pro users get priority processing and 20x more generations')
  } else if (userPlan === 'basic') {
    recommendations.push('👑 Upgrade to Pro for unlimited downloads and priority queue')
    recommendations.push('🔥 Pro users get early access to new AI models')
  }

  // Usage optimization tips
  recommendations.push('💡 Tip: Use specific, detailed prompts for better results')
  recommendations.push('🎯 Try different styles and sizes to create unique artwork')

  return recommendations
}