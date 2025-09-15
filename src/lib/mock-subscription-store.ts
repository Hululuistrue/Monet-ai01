// 简单的内存存储来模拟订阅状态
// 在生产环境中，这应该存储在数据库中

interface MockSubscription {
  userId: string
  planName: string
  status: string
  subscribedAt: string
  sessionId?: string
}

class MockSubscriptionStore {
  private subscriptions: Map<string, MockSubscription> = new Map()

  // 设置用户订阅
  setUserSubscription(userId: string, planName: string, sessionId?: string) {
    this.subscriptions.set(userId, {
      userId,
      planName,
      status: 'active',
      subscribedAt: new Date().toISOString(),
      sessionId
    })
  }

  // 获取用户订阅
  getUserSubscription(userId: string): MockSubscription | null {
    return this.subscriptions.get(userId) || null
  }

  // 取消用户订阅
  cancelUserSubscription(userId: string) {
    const subscription = this.subscriptions.get(userId)
    if (subscription) {
      subscription.status = 'cancelled'
      this.subscriptions.set(userId, subscription)
    }
  }

  // 检查用户是否有活跃订阅
  hasActiveSubscription(userId: string): boolean {
    const subscription = this.subscriptions.get(userId)
    return subscription?.status === 'active' && subscription.planName !== 'free'
  }
}

// 创建单例实例
export const mockSubscriptionStore = new MockSubscriptionStore()