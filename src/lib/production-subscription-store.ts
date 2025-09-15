// 生产就绪的订阅存储，支持多种后端
import { supabase } from './supabase'

interface SubscriptionData {
  userId: string
  planName: string
  status: string
  subscribedAt: string
  sessionId?: string
}

class ProductionSubscriptionStore {
  // 使用简单的客户端存储和 API 路由来处理订阅状态
  
  private getLocalStorageKey(userId: string): string {
    return `subscription_${userId}`
  }

  // 设置用户订阅
  async setUserSubscription(userId: string, planName: string, sessionId?: string) {
    const subscriptionData: SubscriptionData = {
      userId,
      planName,
      status: 'active',
      subscribedAt: new Date().toISOString(),
      sessionId
    }

    // 1. 存储到 localStorage (客户端缓存)
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.getLocalStorageKey(userId), JSON.stringify(subscriptionData))
      // 存储到全局存储，用于跨标签页同步
      localStorage.setItem(`global_subscription_${userId}`, JSON.stringify(subscriptionData))
    }

    // 2. 通过 API 路由存储到服务器端 (用于 API 调用)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // 调用专门的 API 来更新订阅状态
        const response = await fetch('/api/subscription/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            planName,
            sessionId
          })
        })

        if (!response.ok) {
          console.error('Failed to update subscription via API')
        }
      }
    } catch (error) {
      console.error('Failed to save subscription to server:', error)
    }

    console.log(`User ${userId} subscription updated to ${planName}`)
  }

  // 获取用户订阅
  async getUserSubscription(userId: string): Promise<SubscriptionData | null> {
    try {
      // 1. 首先检查 localStorage (最快)
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(`global_subscription_${userId}`)
        if (cached) {
          const data = JSON.parse(cached)
          // 验证数据是否还有效（1小时内）
          const age = Date.now() - new Date(data.subscribedAt).getTime()
          if (age < 60 * 60 * 1000) { // 1小时内认为有效
            return data
          }
        }
      }

      // 2. 从 API 获取最新状态
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const response = await fetch('/api/subscription/status', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data.plan.name !== 'free') {
            const subscriptionData: SubscriptionData = {
              userId,
              planName: result.data.plan.name,
              status: result.data.status,
              subscribedAt: new Date().toISOString(),
              sessionId: result.data.subscription_id
            }

            // 缓存到 localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem(`global_subscription_${userId}`, JSON.stringify(subscriptionData))
            }

            return subscriptionData
          }
        }
      }

      return null
    } catch (error) {
      console.error('Failed to get subscription:', error)
      return null
    }
  }

  // 取消用户订阅
  async cancelUserSubscription(userId: string) {
    try {
      // 更新 localStorage
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(`global_subscription_${userId}`)
        if (cached) {
          const data = JSON.parse(cached)
          data.status = 'cancelled'
          localStorage.setItem(`global_subscription_${userId}`, JSON.stringify(data))
        }
      }

      // 通过 API 取消订阅
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await fetch('/api/subscription', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
    }
  }

  // 检查用户是否有活跃订阅
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId)
    return subscription?.status === 'active' && subscription.planName !== 'free'
  }

  // 清除缓存（用于调试）
  clearCache(userId: string) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.getLocalStorageKey(userId))
      localStorage.removeItem(`global_subscription_${userId}`)
    }
  }
}

export const productionSubscriptionStore = new ProductionSubscriptionStore()