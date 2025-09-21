import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { creemPayment } from '@/lib/creem'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-creem-signature')
    const timestamp = request.headers.get('x-creem-timestamp')

    if (!signature || !timestamp) {
      console.error('Missing Creem webhook signature or timestamp')
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 })
    }

    // Verify webhook signature
    const isValid = await creemPayment.verifyWebhookSignature(body, signature, timestamp)
    if (!isValid) {
      console.error('Invalid Creem webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Parse webhook payload
    const webhookData = creemPayment.parseWebhookPayload(body)
    console.log('Creem webhook received:', webhookData.eventType, webhookData.paymentId)

    const supabase = getSupabaseAdmin()

    // Handle different webhook events
    switch (webhookData.eventType) {
      case 'payment.completed':
        await handlePaymentCompleted(webhookData, supabase)
        break
      
      case 'payment.failed':
        await handlePaymentFailed(webhookData, supabase)
        break
      
      case 'payment.cancelled':
        await handlePaymentCancelled(webhookData, supabase)
        break
      
      default:
        console.log(`Unhandled Creem webhook event: ${webhookData.eventType}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Creem webhook processing error:', error)
    return NextResponse.json({ 
      error: 'Webhook processing failed' 
    }, { status: 500 })
  }
}

async function handlePaymentCompleted(webhookData: any, supabase: any) {
  try {
    const { paymentId, orderId, metadata } = webhookData
    const { userId, planName, interval } = metadata || {}

    if (!userId || !planName) {
      console.error('Missing required metadata in payment completed webhook')
      return
    }

    // Update payment intent status
    await supabase
      .from('payment_intents')
      .update({
        status: 'succeeded',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)

    // Calculate subscription dates
    const now = new Date()
    const periodEnd = new Date(now)
    if (interval === 'yearly') {
      periodEnd.setFullYear(now.getFullYear() + 1)
    } else {
      periodEnd.setMonth(now.getMonth() + 1)
    }

    // Create or update subscription
    const { error: subError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan_name: planName,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        payment_method: 'creem',
        interval,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      })

    if (subError) {
      console.error('Failed to create/update subscription:', subError)
    }

    // Reset user credits based on new plan
    const planLimits = getPlanLimits(planName)
    await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        daily_count: 0,
        hourly_count: 0,
        daily_reset_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        hourly_reset_at: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
        updated_at: now.toISOString()
      })

    console.log(`✅ Creem payment completed for user ${userId}, plan: ${planName}`)

  } catch (error) {
    console.error('Error handling payment completed:', error)
  }
}

async function handlePaymentFailed(webhookData: any, supabase: any) {
  try {
    const { paymentId } = webhookData

    // Update payment intent status
    await supabase
      .from('payment_intents')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)

    console.log(`❌ Creem payment failed: ${paymentId}`)

  } catch (error) {
    console.error('Error handling payment failed:', error)
  }
}

async function handlePaymentCancelled(webhookData: any, supabase: any) {
  try {
    const { paymentId } = webhookData

    // Update payment intent status
    await supabase
      .from('payment_intents')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)

    console.log(`🚫 Creem payment cancelled: ${paymentId}`)

  } catch (error) {
    console.error('Error handling payment cancelled:', error)
  }
}

function getPlanLimits(planName: string) {
  const limits = {
    free: { daily: 10, hourly: 2 },
    basic: { daily: 50, hourly: 10 },
    pro: { daily: 200, hourly: 20 }
  }
  
  return limits[planName as keyof typeof limits] || limits.free
}