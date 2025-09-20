'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  Clock,
  Crown,
  Zap,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AnalyticsData {
  overview: {
    today: { generations: number; users: number; tokens: number; cost: number }
    week: { generations: number; users: number; tokens: number; cost: number }
    month: { generations: number; users: number; tokens: number; cost: number }
  }
  planDistribution: Record<string, number>
  hourlyData: { hour: number; generations: number }[]
  timestamp: string
}

export default function AdminDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    setUser(session.user)
    
    // Check if user is admin
    const isAdmin = session.user.email === 'admin@monet-ai.top' || 
                   session.user.user_metadata?.role === 'admin'
    
    if (!isAdmin) {
      router.push('/')
      return
    }

    fetchAnalytics(session.access_token)
  }

  const fetchAnalytics = async (token: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/usage', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()
      
      if (result.success) {
        setAnalyticsData(result.data)
      } else {
        setError(result.error || 'Failed to fetch analytics')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    if (user) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          fetchAnalytics(session.access_token)
        }
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={handleRefresh}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return null
  }

  const { overview, planDistribution, hourlyData } = analyticsData

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`
  const formatNumber = (num: number) => num.toLocaleString()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Real-time analytics and insights</p>
          </div>
          <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Generations</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(overview.today.generations)}</div>
              <p className="text-xs text-muted-foreground">
                {overview.today.users} active users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Usage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(overview.week.generations)}</div>
              <p className="text-xs text-muted-foreground">
                {overview.week.users} unique users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(overview.month.cost)}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(overview.month.tokens)} tokens used
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(planDistribution).reduce((sum, count) => sum + count, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all plans
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Plan Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Plan Distribution</CardTitle>
              <CardDescription>User subscription breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(planDistribution).map(([plan, count]) => {
                  const total = Object.values(planDistribution).reduce((sum, c) => sum + c, 0)
                  const percentage = total > 0 ? (count / total * 100) : 0
                  
                  const planConfig = {
                    free: { color: 'bg-gray-500', icon: Users, label: 'Free Plan' },
                    basic: { color: 'bg-blue-500', icon: Zap, label: 'Basic Plan' },
                    pro: { color: 'bg-purple-500', icon: Crown, label: 'Pro Plan' }
                  }
                  
                  const config = planConfig[plan as keyof typeof planConfig] || planConfig.free
                  const Icon = config.icon

                  return (
                    <div key={plan} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${config.color}`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-medium">{config.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{count}</div>
                        <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hourly Activity</CardTitle>
              <CardDescription>Generations by hour (last 24h)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {hourlyData.slice(0, 12).map((data) => {
                  const maxGenerations = Math.max(...hourlyData.map(h => h.generations))
                  const width = maxGenerations > 0 ? (data.generations / maxGenerations * 100) : 0
                  
                  return (
                    <div key={data.hour} className="flex items-center gap-3">
                      <div className="w-8 text-sm text-gray-600">
                        {data.hour.toString().padStart(2, '0')}:00
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <div className="w-12 text-sm text-right font-medium">
                        {data.generations}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Statistics</CardTitle>
            <CardDescription>Comprehensive usage metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Today</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Generations:</span>
                    <span className="font-medium">{formatNumber(overview.today.generations)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Users:</span>
                    <span className="font-medium">{formatNumber(overview.today.users)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tokens Used:</span>
                    <span className="font-medium">{formatNumber(overview.today.tokens)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue:</span>
                    <span className="font-medium">{formatCurrency(overview.today.cost)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">This Week</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Generations:</span>
                    <span className="font-medium">{formatNumber(overview.week.generations)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Users:</span>
                    <span className="font-medium">{formatNumber(overview.week.users)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tokens Used:</span>
                    <span className="font-medium">{formatNumber(overview.week.tokens)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue:</span>
                    <span className="font-medium">{formatCurrency(overview.week.cost)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">This Month</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Generations:</span>
                    <span className="font-medium">{formatNumber(overview.month.generations)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Users:</span>
                    <span className="font-medium">{formatNumber(overview.month.users)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tokens Used:</span>
                    <span className="font-medium">{formatNumber(overview.month.tokens)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue:</span>
                    <span className="font-medium">{formatCurrency(overview.month.cost)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-500">
          Last updated: {new Date(analyticsData.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  )
}