import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

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

    // Check if user is admin (you can implement your own admin check logic)
    const isAdmin = user.email === 'admin@monet-ai.top' || user.user_metadata?.role === 'admin'
    
    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get today's statistics
    const { data: todayStats } = await supabase
      .from('generated_images')
      .select('user_id, created_at, tokens_used, cost')
      .gte('created_at', yesterday.toISOString())

    // Get this week's statistics  
    const { data: weekStats } = await supabase
      .from('generated_images')
      .select('user_id, created_at, tokens_used, cost')
      .gte('created_at', lastWeek.toISOString())

    // Get this month's statistics
    const { data: monthStats } = await supabase
      .from('generated_images')
      .select('user_id, created_at, tokens_used, cost')
      .gte('created_at', lastMonth.toISOString())

    // Get user subscription distribution
    const { data: subscriptions } = await supabase
      .rpc('get_all_user_subscriptions')

    // Calculate metrics
    const todayGenerations = todayStats?.length || 0
    const weekGenerations = weekStats?.length || 0
    const monthGenerations = monthStats?.length || 0
    
    const todayUsers = new Set(todayStats?.map(s => s.user_id)).size
    const weekUsers = new Set(weekStats?.map(s => s.user_id)).size
    const monthUsers = new Set(monthStats?.map(s => s.user_id)).size

    const todayTokens = todayStats?.reduce((sum, s) => sum + (s.tokens_used || 0), 0) || 0
    const weekTokens = weekStats?.reduce((sum, s) => sum + (s.tokens_used || 0), 0) || 0
    const monthTokens = monthStats?.reduce((sum, s) => sum + (s.tokens_used || 0), 0) || 0

    const todayCost = todayStats?.reduce((sum, s) => sum + (s.cost || 0), 0) || 0
    const weekCost = weekStats?.reduce((sum, s) => sum + (s.cost || 0), 0) || 0
    const monthCost = monthStats?.reduce((sum, s) => sum + (s.cost || 0), 0) || 0

    // Plan distribution
    const planDistribution = subscriptions?.reduce((acc: any, sub: any) => {
      const plan = sub.plan_name || 'free'
      acc[plan] = (acc[plan] || 0) + 1
      return acc
    }, {}) || { free: 0, basic: 0, pro: 0 }

    // Hourly distribution for today
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourStart = new Date(yesterday)
      hourStart.setHours(hour, 0, 0, 0)
      const hourEnd = new Date(yesterday)
      hourEnd.setHours(hour + 1, 0, 0, 0)
      
      const hourGenerations = todayStats?.filter(s => {
        const createdAt = new Date(s.created_at)
        return createdAt >= hourStart && createdAt < hourEnd
      }).length || 0

      return {
        hour,
        generations: hourGenerations
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          today: {
            generations: todayGenerations,
            users: todayUsers,
            tokens: todayTokens,
            cost: todayCost
          },
          week: {
            generations: weekGenerations,
            users: weekUsers,
            tokens: weekTokens,
            cost: weekCost
          },
          month: {
            generations: monthGenerations,
            users: monthUsers,
            tokens: monthTokens,
            cost: monthCost
          }
        },
        planDistribution,
        hourlyData,
        timestamp: now.toISOString()
      }
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}