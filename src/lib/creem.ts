// Creem Payment Integration Library
// Docs: https://docs.creem.io/

export interface CreemConfig {
  merchantId: string
  apiKey: string
  apiSecret: string
  baseUrl: string
  webhookSecret: string
}

export interface CreemPaymentRequest {
  orderId: string
  amount: number
  currency: string
  description: string
  customerEmail?: string
  customerName?: string
  returnUrl: string
  cancelUrl: string
  webhookUrl: string
  metadata?: Record<string, any>
}

export interface CreemPaymentResponse {
  success: boolean
  paymentId: string
  paymentUrl: string
  qrCode?: string
  error?: string
}

export interface CreemWebhookPayload {
  eventType: string
  paymentId: string
  orderId: string
  status: string
  amount: number
  currency: string
  paidAt?: string
  metadata?: Record<string, any>
}

class CreemPaymentService {
  private config: CreemConfig

  constructor() {
    this.config = {
      merchantId: process.env.CREEM_MERCHANT_ID || '',
      apiKey: process.env.CREEM_API_KEY || '',
      apiSecret: process.env.CREEM_API_SECRET || '',
      baseUrl: process.env.CREEM_BASE_URL || 'https://api.creem.io',
      webhookSecret: process.env.CREEM_WEBHOOK_SECRET || ''
    }

    if (!this.config.merchantId || !this.config.apiKey || !this.config.apiSecret) {
      console.warn('Creem payment configuration incomplete. Please check environment variables.')
    }
  }

  private async generateSignature(data: string, timestamp: string): Promise<string> {
    const crypto = await import('crypto')
    const payload = `${timestamp}.${data}`
    return crypto.createHmac('sha256', this.config.apiSecret).update(payload).digest('hex')
  }

  private async makeRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const url = `${this.config.baseUrl}${endpoint}`
    
    const requestData = data ? JSON.stringify(data) : ''
    const signature = await this.generateSignature(requestData, timestamp)

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Creem-Merchant-ID': this.config.merchantId,
      'X-Creem-API-Key': this.config.apiKey,
      'X-Creem-Timestamp': timestamp,
      'X-Creem-Signature': signature
    }

    const options: RequestInit = {
      method,
      headers,
      ...(data && { body: requestData })
    }

    try {
      const response = await fetch(url, options)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Creem API request failed')
      }

      return result
    } catch (error) {
      console.error('Creem API Error:', error)
      throw error
    }
  }

  async createPayment(paymentRequest: CreemPaymentRequest): Promise<CreemPaymentResponse> {
    try {
      const response = await this.makeRequest('/v1/payments', 'POST', {
        order_id: paymentRequest.orderId,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        description: paymentRequest.description,
        customer_email: paymentRequest.customerEmail,
        customer_name: paymentRequest.customerName,
        return_url: paymentRequest.returnUrl,
        cancel_url: paymentRequest.cancelUrl,
        webhook_url: paymentRequest.webhookUrl,
        metadata: paymentRequest.metadata
      })

      return {
        success: true,
        paymentId: response.payment_id,
        paymentUrl: response.payment_url,
        qrCode: response.qr_code
      }
    } catch (error) {
      return {
        success: false,
        paymentId: '',
        paymentUrl: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async getPaymentStatus(paymentId: string): Promise<any> {
    try {
      return await this.makeRequest(`/v1/payments/${paymentId}`)
    } catch (error) {
      console.error('Failed to get payment status:', error)
      throw error
    }
  }

  async verifyWebhookSignature(payload: string, signature: string, timestamp: string): Promise<boolean> {
    try {
      const expectedSignature = await this.generateSignature(payload, timestamp)
      return expectedSignature === signature
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return false
    }
  }

  parseWebhookPayload(payload: string): CreemWebhookPayload {
    try {
      const data = JSON.parse(payload)
      return {
        eventType: data.event_type,
        paymentId: data.payment_id,
        orderId: data.order_id,
        status: data.status,
        amount: data.amount,
        currency: data.currency,
        paidAt: data.paid_at,
        metadata: data.metadata
      }
    } catch (error) {
      console.error('Failed to parse webhook payload:', error)
      throw new Error('Invalid webhook payload')
    }
  }
}

export const creemPayment = new CreemPaymentService()

// Subscription plan mapping for Creem
export const CREEM_PLAN_PRICES = {
  basic: {
    monthly: { amount: 999, currency: 'CNY' }, // ¥9.99
    yearly: { amount: 9999, currency: 'CNY' }  // ¥99.99
  },
  pro: {
    monthly: { amount: 2999, currency: 'CNY' }, // ¥29.99
    yearly: { amount: 29999, currency: 'CNY' }  // ¥299.99
  }
}

export function getCreemPlanPrice(planName: string, interval: 'monthly' | 'yearly' = 'monthly') {
  const plan = CREEM_PLAN_PRICES[planName as keyof typeof CREEM_PLAN_PRICES]
  return plan ? plan[interval] : null
}