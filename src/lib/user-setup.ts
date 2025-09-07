import { getSupabaseAdmin } from '@/lib/supabase'

export async function createDefaultSubscriptionForNewUser(userId: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    // 检查用户是否已经有订阅
    const { data: existingSubscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single()
    
    if (existingSubscription) {
      console.log(`User ${userId} already has a subscription`)
      return existingSubscription
    }
    
    // 获取免费计划
    const { data: freePlan } = await supabaseAdmin
      .from('subscription_plans')
      .select('id')
      .eq('name', 'free')
      .single()
    
    if (!freePlan) {
      console.error('Free plan not found in database')
      return null
    }
    
    // 为新用户创建免费订阅
    const { data: newSubscription, error } = await supabaseAdmin
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: freePlan.id,
        status: 'active',
        cancel_at_period_end: false,
        current_period_start: new Date().toISOString(),
        current_period_end: null, // 免费计划没有结束时间
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('Error creating free subscription:', error)
      return null
    }
    
    // 初始化用户使用记录
    await supabaseAdmin
      .from('user_usage')
      .insert({
        user_id: userId,
        daily_used: 0,
        hourly_used: 0,
        last_generation: new Date().toISOString(),
      })
    
    console.log(`Created free subscription for new user: ${userId}`)
    return newSubscription
    
  } catch (error) {
    console.error('Error in createDefaultSubscriptionForNewUser:', error)
    return null
  }
}

export async function getUserSubscriptionWithPlan(userId: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    const { data: subscription, error } = await supabaseAdmin
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans!inner(
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
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()
    
    if (error || !subscription) {
      console.log(`No active subscription found for user: ${userId}`)
      // 为用户创建默认的免费订阅
      await createDefaultSubscriptionForNewUser(userId)
      
      // 重新获取订阅信息
      const { data: newSubscription } = await supabaseAdmin
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans!inner(
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
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()
      
      return newSubscription
    }
    
    return subscription
    
  } catch (error) {
    console.error('Error getting user subscription:', error)
    return null
  }
}