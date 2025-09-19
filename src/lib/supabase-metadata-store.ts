import { supabase } from './supabase'

interface SubscriptionMetadata {
  subscription_plan: string
  subscription_status: string
  subscribed_at: string
  session_id?: string
}

export class SupabaseMetadataSubscriptionStore {
  // 设置用户订阅（存储在用户 metadata 中）
  async setUserSubscription(userId: string, planName: string, sessionId?: string) {
    const metadata: SubscriptionMetadata = {
      subscription_plan: planName,
      subscription_status: 'active',
      subscribed_at: new Date().toISOString(),
      session_id: sessionId
    }

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...metadata
      }
    })

    if (error) {
      console.error('Failed to update user metadata:', error)
    }
  }

  // 从当前用户会话获取订阅信息
  async getCurrentUserSubscription(): Promise<SubscriptionMetadata | null> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.user_metadata) {
      return null
    }

    const metadata = user.user_metadata as Record<string, unknown>
    
    if (metadata.subscription_plan && metadata.subscription_status) {
      return {
        subscription_plan: metadata.subscription_plan as string,
        subscription_status: metadata.subscription_status as string,
        subscribed_at: (metadata.subscribed_at as string) || new Date().toISOString(),
        session_id: metadata.session_id as string | undefined
      }
    }

    return null
  }

  // 取消用户订阅
  async cancelUserSubscription(userId: string) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        subscription_status: 'cancelled'
      }
    })

    if (error) {
      console.error('Failed to cancel subscription:', error)
    }
  }
}

export const supabaseMetadataStore = new SupabaseMetadataSubscriptionStore()