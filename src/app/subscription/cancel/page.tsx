'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { XCircle, RefreshCcw, ArrowRight, Home } from 'lucide-react'
import Link from 'next/link'

export default function SubscriptionCancelPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/subscription')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Cancelled</h1>
        <p className="text-gray-600 mb-8">
          Your payment was cancelled and no charges were made to your account. 
          You can try again anytime or continue with your current plan.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <RefreshCcw className="w-5 h-5 text-amber-600 mr-2" />
            <span className="text-sm font-medium text-amber-800">
              Redirecting in {countdown} seconds
            </span>
          </div>
          <p className="text-xs text-amber-700">
            You'll be automatically redirected to the subscription page.
          </p>
        </div>

        <div className="space-y-3">
          <Link 
            href="/subscription"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all"
          >
            Try Different Plan
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          
          <Link 
            href="/generate"
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            Continue with Free Plan
            <Home className="w-4 h-4 ml-2" />
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Why upgrade?</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Generate up to 200 images per day</li>
            <li>• Batch generation (2-4 images at once)</li>
            <li>• HD quality and advanced parameters</li>
            <li>• Priority support</li>
          </ul>
        </div>
      </div>
    </div>
  )
}