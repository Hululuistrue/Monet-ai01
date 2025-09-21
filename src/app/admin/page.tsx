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
      setLoading(false)
      return
    }

    setUser(session.user)
    
    // Strict admin check - only specific admin emails allowed
    const adminEmails = [
      'admin@monet-ai.top',
      'administrator@monet-ai.top',
      'support@monet-ai.top'
    ]
    
    const isAdmin = adminEmails.includes(session.user.email || '') || 
                   session.user.user_metadata?.role === 'admin'
    
    if (!isAdmin) {
      setError('Access denied: Admin privileges required')
      setLoading(false)
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

  const handleAdminLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin`
        }
      })
    } catch (err) {
      setError('Login failed')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setAnalyticsData(null)
    setError(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  // Show login screen for unauthenticated users or access denied
  if (!user || error === 'Access denied: Admin privileges required') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border border-gray-200">
          <div className="text-center">
            {/* Lock Icon */}
            <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Access</h1>
            <p className="text-gray-600 mb-6">
              {!user ? 'Sign in with your administrator account' : 'Access denied: Administrator privileges required'}
            </p>
            
            {error && error !== 'Access denied: Admin privileges required' && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}
            
            {user && (
              <div className="mb-4 p-3 bg-orange-100 border border-orange-300 rounded-xl text-orange-700 text-sm">
                <p className="font-medium">Current user: {user.email}</p>
                <p>This account does not have admin privileges.</p>
              </div>
            )}
            
            <div className="space-y-3">
              {!user ? (
                <button
                  onClick={handleAdminLogin}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </div>
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleSignOut}
                    className="w-full bg-gray-600 text-white py-3 rounded-xl font-bold hover:bg-gray-700 transition-colors"
                  >
                    Sign Out & Try Different Account
                  </button>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                  >
                    Back to Home
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Authorized Admin Emails:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• admin@monet-ai.top</li>
                <li>• administrator@monet-ai.top</li>
                <li>• support@monet-ai.top</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && error !== 'Access denied: Admin privileges required') {
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
            {user && (
              <p className="text-sm text-gray-500 mt-1">Logged in as: {user.email}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button onClick={handleSignOut} variant="outline" className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              Sign Out
            </Button>
          </div>
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