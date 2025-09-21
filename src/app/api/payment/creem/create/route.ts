import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { creemPayment, getCreemPlanPrice } from '@/lib/creem'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Check if Creem is properly configured
    if (!creemPayment.isConfigured()) {
      console.error('Creem payment configuration incomplete. Missing CREEM_API_KEY or CREEM_WEBHOOK_SECRET')
      return NextResponse.json({ 
        error: 'Payment service temporarily unavailable. Please try Stripe payment instead.',
        errorCode: 'CREEM_CONFIG_MISSING'
      }, { status: 503 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
    }

    const body = await request.json()
    const { planName, interval = 'monthly' } = body

    if (!planName || !['basic', 'pro'].includes(planName)) {
      return NextResponse.json({ error: 'Invalid plan name' }, { status: 400 })
    }

    // Get plan pricing
    const planPrice = getCreemPlanPrice(planName, interval)
    if (!planPrice) {
      return NextResponse.json({ error: 'Plan pricing not found' }, { status: 400 })
    }

    // Generate unique order ID
    const orderId = `monet_${planName}_${interval}_${user.id}_${Date.now()}`

    // Create payment with Creem
    const paymentResult = await creemPayment.createPayment({
      orderId,
      amount: planPrice.amount,
      currency: planPrice.currency,
      description: `Monet-AI ${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan - ${interval}`,
      customerEmail: user.email || '',
      customerName: user.user_metadata?.full_name || user.email || '',
      returnUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/subscription/success?session_id=${orderId}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/subscription?cancelled=true`,
      webhookUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/creem`,
      metadata: {
        userId: user.id,
        planName,
        interval,
        userEmail: user.email
      }
    })

    if (!paymentResult.success) {
      return NextResponse.json({ 
        error: 'Payment creation failed', 
        details: paymentResult.error 
      }, { status: 500 })
    }

    // Store payment intent in database
    const { error: dbError } = await supabase
      .from('payment_intents')
      .insert({
        id: paymentResult.paymentId,
        user_id: user.id,
        amount: planPrice.amount,
        currency: planPrice.currency,
        status: 'pending',
        payment_method: 'creem',
        metadata: {
          orderId,
          planName,
          interval,
          creem_payment_id: paymentResult.paymentId
        },
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Failed to store payment intent:', dbError)
    }

    return NextResponse.json({
      success: true,
      paymentId: paymentResult.paymentId,
      paymentUrl: paymentResult.paymentUrl,
      qrCode: paymentResult.qrCode,
      orderId
    })

  } catch (error) {
    console.error('Creem payment creation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}