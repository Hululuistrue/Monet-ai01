// 共享的内存存储，在所有 API 路由之间共享
interface SubscriptionData {
  userId: string
  planName: string
  status: string
  subscribedAt: string
  sessionId?: string
}

class SharedSubscriptionStore {
  private store: Map<string, SubscriptionData> = new Map()

  set(userId: string, data: SubscriptionData) {
    this.store.set(userId, data)
    console.log(`[SharedStore] Stored subscription for user ${userId}:`, data)
  }

  get(userId: string): SubscriptionData | null {
    const data = this.store.get(userId) || null
    console.log(`[SharedStore] Retrieved subscription for user ${userId}:`, data)
    return data
  }

  has(userId: string): boolean {
    return this.store.has(userId)
  }

  clear(userId: string): boolean {
    const result = this.store.delete(userId)
    console.log(`[SharedStore] Cleared subscription for user ${userId}:`, result)
    return result
  }

  getAll(): Map<string, SubscriptionData> {
    return new Map(this.store)
  }

  size(): number {
    return this.store.size
  }
}

// 创建全局单例
export const sharedSubscriptionStore = new SharedSubscriptionStore()