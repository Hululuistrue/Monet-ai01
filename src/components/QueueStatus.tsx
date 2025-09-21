'use client'

import { useState, useEffect } from 'react'
import { Clock, Users, Zap, TrendingUp, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface QueueStatusProps {
  authToken?: string
  onStatusUpdate?: (status: any) => void
}

interface QueueData {
  userPlan: string
  queuePosition: number
  estimatedWaitTime: number
  planLimits: any
  queueStats: any
  recommendations: string[]
}

export default function QueueStatus({ authToken, onStatusUpdate }: QueueStatusProps) {
  const [queueData, setQueueData] = useState<QueueData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQueueStatus()
    const interval = setInterval(fetchQueueStatus, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [authToken])

  const fetchQueueStatus = async () => {
    try {
      const headers: any = {
        'Content-Type': 'application/json'
      }
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      const response = await fetch('/api/queue/status', { headers })
      const result = await response.json()
      
      if (result.success) {
        setQueueData(result.data)
        onStatusUpdate?.(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch queue status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded-xl p-4">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  if (!queueData) return null

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'pro': return 'bg-purple-100 text-purple-800'
      case 'basic': return 'bg-blue-100 text-blue-800'
      case 'free': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'pro': return '👑'
      case 'basic': return '⚡'
      case 'free': return '🆓'
      default: return '👤'
    }
  }

  const formatWaitTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  return (
    <div className="space-y-4">
      {/* Plan Status */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getPlanIcon(queueData.userPlan)}</span>
            <span className="font-semibold text-gray-900">
              {queueData.userPlan.charAt(0).toUpperCase() + queueData.userPlan.slice(1)} Plan
            </span>
            <Badge className={getPlanBadgeColor(queueData.userPlan)}>
              Active
            </Badge>
          </div>
          {queueData.queueStats.processing > 0 && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Processing
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900">{queueData.planLimits.daily}</div>
            <div className="text-gray-600">Daily Limit</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">{queueData.planLimits.maxBatchSize}</div>
            <div className="text-gray-600">Batch Size</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">{queueData.planLimits.maxDownloads}</div>
            <div className="text-gray-600">Downloads</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">
              {queueData.planLimits.quality === 'hd' ? 'HD' : 'Standard'}
            </div>
            <div className="text-gray-600">Quality</div>
          </div>
        </div>
      </div>

      {/* Queue Information */}
      {queueData.queueStats.waiting > 0 && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-amber-900">Queue Status</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-amber-700">Your Position:</span>
              <span className="font-semibold text-amber-900">#{queueData.queuePosition}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-700">Est. Wait:</span>
              <span className="font-semibold text-amber-900">
                {formatWaitTime(queueData.estimatedWaitTime)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-700">Queue Size:</span>
              <span className="font-semibold text-amber-900">{queueData.queueStats.waiting}</span>
            </div>
          </div>

          {queueData.userPlan === 'guest' || queueData.userPlan === 'free' ? (
            <div className="mt-3 p-3 bg-amber-100 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Pro users get priority processing! Upgrade to skip the queue.
                </span>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* System Status */}
      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-green-900">System Status</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-green-700">Processing:</span>
            <span className="font-semibold text-green-900">{queueData.queueStats.processing}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-green-700">Waiting:</span>
            <span className="font-semibold text-green-900">{queueData.queueStats.waiting}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-green-700">Avg Wait:</span>
            <span className="font-semibold text-green-900">
              {formatWaitTime(queueData.queueStats.averageWaitTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {queueData.recommendations.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-semibold">Tips & Recommendations:</div>
              <ul className="space-y-1 text-sm">
                {queueData.recommendations.slice(0, 3).map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}