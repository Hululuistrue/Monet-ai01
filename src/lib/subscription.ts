import { supabase } from '@/lib/supabase'

export interface SubscriptionLimits {
  dailyLimit: number
  hourlyLimit: number
  maxBatchSize: number
  planName: string
}

export async function checkSubscriptionLimits(userId: string, requestedBatchSize: number = 1) {
  // Get user's active subscription
  const { data: subscription, error: subError } = await supabase
    .rpc('get_user_active_subscription', { user_uuid: userId })

  let dailyLimit = 3, hourlyLimit = 2, maxBatchSize = 1, planName = 'free'
  
  if (!subError && subscription && subscription.length > 0) {
    const activeSub = subscription[0]
    dailyLimit = activeSub.daily_generations
    hourlyLimit = activeSub.hourly_limit
    maxBatchSize = activeSub.max_batch_size
    planName = activeSub.plan_name
  }

  // Check batch size limit
  if (requestedBatchSize > maxBatchSize) {
    return {
      allowed: false,
      error: `Batch size of ${requestedBatchSize} exceeds your plan limit of ${maxBatchSize}. Upgrade your subscription for larger batches.`,
      errorCode: 'BATCH_SIZE_EXCEEDED'
    }
  }

  // Get current usage
  const { data: credits } = await supabase
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single()

  const now = new Date()
  let dailyUsed = 0, hourlyUsed = 0

  if (credits) {
    // Reset daily count if past reset time
    if (new Date(credits.daily_reset_at) <= now) {
      dailyUsed = 0
      await supabase
        .from('user_credits')
        .update({
          daily_count: 0,
          daily_reset_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('user_id', userId)
    } else {
      dailyUsed = credits.daily_count || 0
    }

    // Reset hourly count if past reset time
    if (new Date(credits.hourly_reset_at) <= now) {
      hourlyUsed = 0
      await supabase
        .from('user_credits')
        .update({
          hourly_count: 0,
          hourly_reset_at: new Date(now.getTime() + 60 * 60 * 1000).toISOString()
        })
        .eq('user_id', userId)
    } else {
      hourlyUsed = credits.hourly_count || 0
    }
  }

  // Check daily limit
  if (dailyUsed >= dailyLimit) {
    return {
      allowed: false,
      error: `Daily limit of ${dailyLimit} generations reached. ${planName === 'free' ? 'Upgrade your subscription for more generations.' : 'Your daily quota will reset in 24 hours.'}`,
      errorCode: 'DAILY_LIMIT_EXCEEDED'
    }
  }

  // Check hourly limit
  if (hourlyUsed >= hourlyLimit) {
    return {
      allowed: false,
      error: `Hourly limit of ${hourlyLimit} generations reached. ${planName === 'free' ? 'Upgrade your subscription for higher limits.' : 'Your hourly quota will reset soon.'}`,
      errorCode: 'HOURLY_LIMIT_EXCEEDED'
    }
  }

  return {
    allowed: true,
    dailyRemaining: dailyLimit - dailyUsed,
    hourlyRemaining: hourlyLimit - hourlyUsed,
    planName
  }
}

export async function updateUsageCount(userId: string) {
  const now = new Date()
  
  // First get current values
  const { data: currentCredits } = await supabase
    .from('user_credits')
    .select('daily_count, hourly_count, total_generated')
    .eq('user_id', userId)
    .single()

  // Increment both daily and hourly counts
  const { error } = await supabase
    .from('user_credits')
    .upsert({
      user_id: userId,
      daily_count: (currentCredits?.daily_count || 0) + 1,
      hourly_count: (currentCredits?.hourly_count || 0) + 1,
      total_generated: (currentCredits?.total_generated || 0) + 1,
      updated_at: now.toISOString()
    })

  if (error) {
    console.error('Failed to update usage count:', error)
  }
}

export async function getUserSubscriptionInfo(userId: string) {
  const { data: subscription, error } = await supabase
    .rpc('get_user_active_subscription', { user_uuid: userId })

  if (error || !subscription || subscription.length === 0) {
    // Return free plan defaults
    return {
      planName: 'free',
      dailyLimit: 3,
      hourlyLimit: 2,
      maxBatchSize: 1,
      features: ['Basic generation', 'Standard quality']
    }
  }

  const activeSub = subscription[0]
  return {
    planName: activeSub.plan_name,
    displayName: activeSub.plan_display_name,
    dailyLimit: activeSub.daily_generations,
    hourlyLimit: activeSub.hourly_limit,
    maxBatchSize: activeSub.max_batch_size,
    features: activeSub.features || [],
    status: activeSub.status,
    currentPeriodEnd: activeSub.current_period_end
  }
}