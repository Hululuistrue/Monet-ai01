/**
 * 队列优先级管理系统
 * 实现Pro用户优先处理机制
 */

interface QueueItem {
  id: string
  userId: string | null
  planType: string
  prompt: string
  priority: number
  createdAt: Date
  estimatedProcessTime: number
}

interface QueueStats {
  total: number
  processing: number
  waiting: number
  averageWaitTime: number
  priorityDistribution: Record<string, number>
}

class QueueManager {
  private queue: QueueItem[] = []
  private processing: Set<string> = new Set()
  private maxConcurrent = 5 // 最大并发处理数
  
  // 优先级映射
  private priorityMapping = {
    guest: 1,
    free: 2,
    basic: 3,
    pro: 5
  }

  /**
   * 添加任务到队列
   */
  addToQueue(item: Omit<QueueItem, 'id' | 'priority' | 'createdAt' | 'estimatedProcessTime'>): string {
    const id = this.generateId()
    const priority = this.priorityMapping[item.planType as keyof typeof this.priorityMapping] || 1
    const estimatedProcessTime = this.estimateProcessTime(item.planType)
    
    const queueItem: QueueItem = {
      ...item,
      id,
      priority,
      createdAt: new Date(),
      estimatedProcessTime
    }

    // 插入到正确的位置（按优先级排序）
    const insertIndex = this.findInsertPosition(queueItem)
    this.queue.splice(insertIndex, 0, queueItem)

    return id
  }

  /**
   * 获取下一个要处理的任务
   */
  getNext(): QueueItem | null {
    if (this.processing.size >= this.maxConcurrent) {
      return null
    }

    // 获取最高优先级的任务
    const item = this.queue.shift()
    if (item) {
      this.processing.add(item.id)
    }
    
    return item || null
  }

  /**
   * 标记任务完成
   */
  markCompleted(itemId: string): void {
    this.processing.delete(itemId)
  }

  /**
   * 移除任务（取消或失败）
   */
  removeItem(itemId: string): boolean {
    // 从队列中移除
    const queueIndex = this.queue.findIndex(item => item.id === itemId)
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1)
      return true
    }

    // 从处理中移除
    if (this.processing.has(itemId)) {
      this.processing.delete(itemId)
      return true
    }

    return false
  }

  /**
   * 获取用户在队列中的位置
   */
  getUserPosition(itemId: string): number {
    const index = this.queue.findIndex(item => item.id === itemId)
    return index === -1 ? -1 : index + 1
  }

  /**
   * 估算等待时间
   */
  getEstimatedWaitTime(itemId: string): number {
    const position = this.getUserPosition(itemId)
    if (position === -1) return 0

    // 计算前面任务的估算处理时间
    const itemsAhead = this.queue.slice(0, position - 1)
    const processingTime = itemsAhead.reduce((total, item) => total + item.estimatedProcessTime, 0)
    
    // 考虑当前并发处理能力
    return Math.ceil(processingTime / this.maxConcurrent)
  }

  /**
   * 获取队列统计信息
   */
  getStats(): QueueStats {
    const priorityDistribution = this.queue.reduce((acc, item) => {
      acc[item.planType] = (acc[item.planType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalWaitTime = this.queue.reduce((total, item) => {
      return total + this.getEstimatedWaitTime(item.id)
    }, 0)

    return {
      total: this.queue.length + this.processing.size,
      processing: this.processing.size,
      waiting: this.queue.length,
      averageWaitTime: this.queue.length > 0 ? totalWaitTime / this.queue.length : 0,
      priorityDistribution
    }
  }

  /**
   * 查找插入位置（保持优先级排序）
   */
  private findInsertPosition(item: QueueItem): number {
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority < item.priority) {
        return i
      }
      // 相同优先级按时间先后
      if (this.queue[i].priority === item.priority && 
          this.queue[i].createdAt > item.createdAt) {
        return i
      }
    }
    return this.queue.length
  }

  /**
   * 估算处理时间（秒）
   */
  private estimateProcessTime(planType: string): number {
    const baseTime = {
      guest: 15,    // 游客用户：15秒
      free: 12,     // 免费用户：12秒
      basic: 8,     // 基础用户：8秒
      pro: 5        // Pro用户：5秒
    }
    
    return baseTime[planType as keyof typeof baseTime] || 15
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 清理过期任务（超过5分钟的等待任务）
   */
  cleanupExpiredItems(): number {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const beforeCount = this.queue.length
    
    this.queue = this.queue.filter(item => item.createdAt > fiveMinutesAgo)
    
    return beforeCount - this.queue.length
  }
}

// 全局队列管理器实例
export const globalQueueManager = new QueueManager()

/**
 * 队列状态API辅助函数
 */
export function getQueueStatus(planType: string): {
  position: number
  estimatedWaitTime: number
  stats: QueueStats
} {
  const stats = globalQueueManager.getStats()
  
  // 为新用户估算位置（基于当前队列情况）
  const mockItem = {
    id: 'temp',
    userId: null,
    planType,
    prompt: '',
    priority: 0,
    createdAt: new Date(),
    estimatedProcessTime: 0
  }
  
  const tempId = globalQueueManager.addToQueue({
    userId: null,
    planType,
    prompt: 'temp'
  })
  
  const position = globalQueueManager.getUserPosition(tempId)
  const waitTime = globalQueueManager.getEstimatedWaitTime(tempId)
  
  globalQueueManager.removeItem(tempId)
  
  return {
    position: Math.max(1, position),
    estimatedWaitTime: waitTime,
    stats
  }
}