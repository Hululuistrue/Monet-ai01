import { kv } from '@vercel/kv'

interface SubscriptionData {
  userId: string
  planName: string
  status: string
  subscribedAt: string
  sessionId?: string
}

export class VercelKVSubscriptionStore {
  private getKey(userId: string): string {
    return `subscription:${userId}`
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
    
    await kv.set(this.getKey(userId), subscriptionData)
  }

  // 获取用户订阅
  async getUserSubscription(userId: string): Promise<SubscriptionData | null> {
    try {
      const data = await kv.get<SubscriptionData>(this.getKey(userId))
      return data
    } catch (error) {
      console.error('Failed to get subscription from KV:', error)
      return null
    }
  }

  // 取消用户订阅
  async cancelUserSubscription(userId: string) {
    const subscription = await this.getUserSubscription(userId)
    if (subscription) {
      subscription.status = 'cancelled'
      await kv.set(this.getKey(userId), subscription)
    }
  }

  // 检查用户是否有活跃订阅
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId)
    return subscription?.status === 'active' && subscription.planName !== 'free'
  }
}

// 创建单例实例
export const vercelKVSubscriptionStore = new VercelKVSubscriptionStore()