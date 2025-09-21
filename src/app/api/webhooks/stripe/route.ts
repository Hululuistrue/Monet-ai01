import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sharedSubscriptionStore } from '@/lib/shared-subscription-store'

// Lazy initialization to avoid build-time errors
function getStripeClient() {
  const apiKey = process.env.STRIPE_SECRET_KEY
  if (!apiKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set')
  }
  return new Stripe(apiKey, {
    apiVersion: '2025-08-27.basil',
  })
}

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set')
  }
  return secret
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient()
    const webhookSecret = getWebhookSecret()
    
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      // 如果没有配置 webhook secret，跳过验证（仅在开发环境）
      if (webhookSecret && webhookSecret !== 'your_webhook_secret_here') {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
      } else {
        // 开发环境：解析 JSON 而不验证签名
        event = JSON.parse(body)
      }
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
    }

    // 处理不同类型的 webhook 事件
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    // 获取相关的 checkout session 或订阅信息
    if (paymentIntent.metadata?.user_id && paymentIntent.metadata?.subscription_id) {
      const userId = paymentIntent.metadata.user_id
      const subscriptionId = paymentIntent.metadata.subscription_id
      
      // 查找对应的用户订阅
      const { data: userSubscription } = await supabaseAdmin
        .from('user_subscriptions')
        .select('id')
        .eq('user_id', userId)
        .eq('subscription_id', subscriptionId)
        .single()
      
      // 创建支付历史记录
      await supabaseAdmin
        .from('payment_history')
        .insert({
          user_id: userId,
          subscription_id: userSubscription?.id,
          stripe_payment_intent_id: paymentIntent.id,
          stripe_charge_id: paymentIntent.latest_charge as string | null,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: 'succeeded',
          payment_method: 'card',
          description: paymentIntent.description || `Payment for subscription`,
          receipt_url: null
        })
      
      console.log(`[Webhook] Payment history created for user: ${userId}`)
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const stripe = getStripeClient()
    const supabaseAdmin = getSupabaseAdmin()
    
    if (invoice.customer && (invoice as any).subscription) {
      // 从 Stripe 获取客户信息
      const customer = await stripe.customers.retrieve(invoice.customer as string)
      const subscription = await stripe.subscriptions.retrieve((invoice as any).subscription as string)
      
      if ('metadata' in customer && customer.metadata?.user_id) {
        const userId = customer.metadata.user_id
        
        // 查找对应的用户订阅
        const { data: userSubscription } = await supabaseAdmin
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', userId)
          .eq('subscription_id', subscription.id)
          .single()
        
        // 创建支付历史记录
        await supabaseAdmin
          .from('payment_history')
          .insert({
            user_id: userId,
            subscription_id: userSubscription?.id,
            stripe_payment_intent_id: (invoice as any).payment_intent as string | null,
            stripe_charge_id: (invoice as any).charge as string | null,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: 'succeeded',
            payment_method: 'card',
            description: `Invoice payment - ${invoice.lines.data[0]?.description || 'Subscription'}`,
            receipt_url: invoice.hosted_invoice_url
          })
        
        console.log(`[Webhook] Invoice payment recorded for user: ${userId}`)
      }
    }
  } catch (error) {
    console.error('Error handling invoice payment:', error)
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const stripe = getStripeClient()
  const userId = session.metadata?.user_id
  const planName = session.metadata?.plan_name

  if (!userId || !planName) {
    console.error('Missing metadata in checkout session')
    return
  }

  console.log(`[Webhook] Payment completed: User ${userId} upgraded to ${planName}`)
  
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    // 获取订阅计划信息
    const { data: plan } = await supabaseAdmin
      .from('subscription_plans')
      .select('id, display_name, price')
      .eq('name', planName)
      .single()
    
    if (!plan) {
      console.error(`Plan not found: ${planName}`)
      return
    }
    
    // 获取或创建 Stripe 订阅信息
    let subscriptionId = null
    if (session.subscription) {
      subscriptionId = session.subscription as string
    }
    
    // 创建或更新用户订阅记录
    const subscriptionData = {
      user_id: userId,
      subscription_id: subscriptionId,
      plan_id: plan.id,
      status: 'active',
      cancel_at_period_end: false,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天后
    }
    
    // 先尝试更新现有订阅，如果不存在则创建新的
    const { data: existingSubscription, error: selectError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .single()
    
    let userSubscriptionId: string
    
    if (existingSubscription && !selectError) {
      // 更新现有订阅
      const { data: updatedSubscription } = await supabaseAdmin
        .from('user_subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id)
        .select('id')
        .single()
      
      userSubscriptionId = updatedSubscription?.id || existingSubscription.id
      console.log(`[Webhook] Updated existing subscription for user: ${userId}`)
    } else {
      // 创建新订阅
      const { data: newSubscription } = await supabaseAdmin
        .from('user_subscriptions')
        .insert(subscriptionData)
        .select('id')
        .single()
      
      userSubscriptionId = newSubscription?.id
      console.log(`[Webhook] Created new subscription for user: ${userId}`)
    }
    
    // 创建支付历史记录
    if (session.payment_intent) {
      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent as string)
      
      await supabaseAdmin
        .from('payment_history')
        .insert({
          user_id: userId,
          subscription_id: userSubscriptionId,
          stripe_payment_intent_id: paymentIntent.id,
          stripe_charge_id: paymentIntent.latest_charge as string | null,
          amount: session.amount_total || plan.price,
          currency: session.currency || 'usd',
          status: 'succeeded',
          payment_method: 'card',
          description: `Upgrade to ${plan.display_name}`,
          receipt_url: null,
          // 存储历史计划信息，确保支付历史显示正确的计划名称
          plan_name: planName,
          plan_display_name: plan.display_name,
          plan_price: plan.price
        })
      
      console.log(`[Webhook] Payment history created for user: ${userId}`)
    }
    
    // 存储订阅信息到共享内存（用于即时访问）
    const subscriptionMemoryData = {
      userId,
      planName,
      status: 'active',
      subscribedAt: new Date().toISOString(),
      sessionId: session.id
    }
    
    sharedSubscriptionStore.set(userId, subscriptionMemoryData)
    console.log('[Webhook] Subscription stored in memory for user:', userId)
    
  } catch (error) {
    console.error('Error in checkout session completed webhook:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const stripe = getStripeClient()
    const supabaseAdmin = getSupabaseAdmin()
    
    // 从 Stripe 获取客户信息
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    
    if ('metadata' in customer && customer.metadata?.user_id) {
      const userId = customer.metadata.user_id
      
      // 更新用户订阅状态
      await supabaseAdmin
        .from('user_subscriptions')
        .update({
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        })
        .eq('subscription_id', subscription.id)
      
      console.log(`[Webhook] Subscription updated for user: ${userId}, status: ${subscription.status}`)
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const stripe = getStripeClient()
    const supabaseAdmin = getSupabaseAdmin()
    
    // 从 Stripe 获取客户信息
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    
    if ('metadata' in customer && customer.metadata?.user_id) {
      const userId = customer.metadata.user_id
      
      // 获取免费计划 ID
      const { data: freePlan } = await supabaseAdmin
        .from('subscription_plans')
        .select('id')
        .eq('name', 'free')
        .single()
      
      if (freePlan) {
        // 将用户订阅更改为免费计划
        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            plan_id: freePlan.id,
            status: 'cancelled',
            subscription_id: null,
            cancel_at_period_end: false,
            current_period_end: new Date().toISOString(),
          })
          .eq('subscription_id', subscription.id)
        
        console.log(`[Webhook] Subscription cancelled for user: ${userId}, reverted to free plan`)
      }
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
  }
}