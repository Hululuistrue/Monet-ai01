'use client'

import { useState } from 'react'
import { CreditCard, Smartphone, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaymentMethodSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (method: 'stripe' | 'creem') => void
  planName: string
  loading?: boolean
}

export default function PaymentMethodSelector({ 
  isOpen, 
  onClose, 
  onSelect, 
  planName, 
  loading = false 
}: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'creem'>('stripe')

  if (!isOpen) return null

  const handleContinue = () => {
    onSelect(selectedMethod)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">选择支付方式</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plan Info */}
        <div className="mb-6 p-4 bg-purple-50 rounded-2xl border border-purple-200">
          <h4 className="font-semibold text-purple-900 mb-1">
            {planName === 'basic' ? 'Basic Plan' : 'Pro Plan'}
          </h4>
          <p className="text-purple-700 text-sm">
            {planName === 'basic' 
              ? '50 images/day • HD quality • Priority support' 
              : '200 images/day • HD quality • Priority queue • Commercial use'
            }
          </p>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3 mb-6">
          {/* Stripe */}
          <div 
            className={`p-4 border-2 rounded-2xl cursor-pointer transition-all ${
              selectedMethod === 'stripe' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedMethod('stripe')}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === 'stripe' ? 'border-blue-500' : 'border-gray-300'
              }`}>
                {selectedMethod === 'stripe' && (
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                )}
              </div>
              <CreditCard className="w-6 h-6 text-blue-600" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Stripe 支付</h4>
                <p className="text-sm text-gray-600">信用卡、借记卡、PayPal</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  ${planName === 'basic' ? '9.99' : '19.99'}
                </div>
                <div className="text-sm text-gray-500">/month</div>
              </div>
            </div>
          </div>

          {/* Creem */}
          <div 
            className={`p-4 border-2 rounded-2xl cursor-pointer transition-all ${
              selectedMethod === 'creem' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedMethod('creem')}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === 'creem' ? 'border-green-500' : 'border-gray-300'
              }`}>
                {selectedMethod === 'creem' && (
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                )}
              </div>
              <Smartphone className="w-6 h-6 text-green-600" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Creem Payment</h4>
                <p className="text-sm text-gray-600">Global payment gateway</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  ${planName === 'basic' ? '9.99' : '19.99'}
                </div>
                <div className="text-sm text-gray-500">/month</div>
              </div>
            </div>
            <div className="mt-2 ml-8">
              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                🌍 Global Payment Gateway
              </span>
              <div className="mt-1">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  🎭 Demo Mode - Working Preview
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
            disabled={loading}
          >
            取消
          </Button>
          <Button 
            onClick={handleContinue}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            disabled={loading}
          >
            {loading ? '处理中...' : '继续支付'}
          </Button>
        </div>

        {/* Security Notice */}
        <div className="mt-4 p-3 bg-gray-50 rounded-xl">
          <p className="text-xs text-gray-600 text-center">
            🔒 您的支付信息受到256位SSL加密保护，我们不会存储您的支付详情
          </p>
        </div>
      </div>
    </div>
  )
}