'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, CreditCard, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface PaymentRecord {
  id: string
  stripe_payment_intent_id: string
  amount: number
  currency: string
  status: string
  payment_method: string
  created_at: string
  // 历史计划信息（直接存储在 payment_history 表中）
  plan_name?: string
  plan_display_name?: string
  plan_price?: number
  // 旧的关联查询（保持兼容性）
  user_subscriptions?: {
    subscription_plans?: {
      display_name: string
      name: string
    }
  }
}

interface PaymentHistoryData {
  payments: PaymentRecord[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

interface PaymentHistoryProps {
  user: User | null
}

export default function PaymentHistory({ user }: PaymentHistoryProps) {
  const [data, setData] = useState<PaymentHistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const pageSize = 10

  const fetchPaymentHistory = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/payment-history?limit=${pageSize}&offset=${page * pageSize}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        console.error('Payment history API error:', result.error)
      }
    } catch (error) {
      console.error('Failed to fetch payment history:', error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    if (user) {
      fetchPaymentHistory()
    }
  }, [user, page, fetchPaymentHistory])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'text-green-600 bg-green-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-yellow-600 bg-yellow-50'
    }
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Please sign in to view payment history</h2>
      </div>
    )
  }

  if (loading && !data) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="mt-2 h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <CreditCard className="w-6 h-6 text-purple-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
      </div>

      {!data || data.payments.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No payments yet</h3>
          <p className="text-gray-600">Your payment history will appear here once you make your first payment.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {data.payments.map((payment) => (
                <div key={payment.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(payment.status)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900">
                            {formatAmount(payment.amount, payment.currency)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(payment.created_at)}
                          </div>
                          <span className="capitalize">{payment.payment_method}</span>
                          {/* 优先使用历史计划信息，否则使用关联查询结果 */}
                          {(payment.plan_display_name || payment.user_subscriptions?.subscription_plans) && (
                            <span className="text-purple-600 font-medium">
                              {payment.plan_display_name || payment.user_subscriptions?.subscription_plans?.display_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">
                        Payment ID: {payment.stripe_payment_intent_id?.slice(-8) || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {data.total > pageSize && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, data.total)} of {data.total} payments
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!data.hasMore}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}