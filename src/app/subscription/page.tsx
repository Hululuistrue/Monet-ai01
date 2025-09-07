'use client'

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, LogOut, History, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import SubscriptionManager from '@/components/SubscriptionManager'
import PaymentHistory from '@/components/PaymentHistory'
import { User as SupabaseUser } from '@supabase/supabase-js'

function SubscriptionContent() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [activeTab, setActiveTab] = useState<'plans' | 'history'>('plans')
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const selectedPlan = searchParams.get('plan') // 获取URL参数中的计划

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const tabs = [
    { id: 'plans', name: 'Plans & Settings', icon: Settings },
    { id: 'history', name: 'Payment History', icon: History }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Loading your subscription...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-xl animate-bounce"></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(139,69,195,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,69,195,0.03)_1px,transparent_1px)] bg-[size:72px_72px]"></div>
        </div>

        <div className="relative flex items-center justify-center min-h-screen px-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-12 max-w-md mx-auto text-center border border-white/20">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-8">Please sign in to manage your subscription and view your artistic journey.</p>
            <div className="space-y-4">
              <Link
                href="/auth/login"
                className="block w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-2xl transition-all duration-300 hover:shadow-lg transform hover:scale-105"
              >
                Sign In to Continue
              </Link>
              <Link
                href="/"
                className="block w-full px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-2xl transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-xl animate-bounce"></div>
        <div className="absolute bottom-40 left-20 w-40 h-40 bg-gradient-to-r from-pink-400/20 to-purple-400/20 rounded-full blur-2xl animate-pulse"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,69,195,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,69,195,0.03)_1px,transparent_1px)] bg-[size:72px_72px]"></div>
      </div>

      {/* Header Banner */}
      <div className="relative border-b border-white/10 bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Left: Logo and Title */}
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="group flex items-center gap-3 px-6 py-3 bg-white/70 backdrop-blur-sm border border-gray-200/50 hover:border-purple-200 rounded-2xl transition-all duration-300 hover:shadow-lg transform hover:scale-105"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
                <span className="font-semibold text-gray-700 group-hover:text-purple-700">Back to Home</span>
              </Link>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-30 blur"></div>
                  <div className="relative bg-white rounded-full p-3 shadow-lg">
                    <img src="/logo.png" alt="Monet-AI Logo" className="w-12 h-12 object-contain rounded-full" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-gray-900">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Monet-AI
                    </span>
                    <span className="block text-lg font-bold text-gray-700 mt-1">Subscription Studio</span>
                  </h1>
                </div>
              </div>
            </div>
            
            {/* Right: User Info */}
            <div className="flex items-center gap-4">
              <div className="bg-white/50 backdrop-blur-sm rounded-2xl px-6 py-3 border border-gray-200/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{user.email}</p>
                    <p className="text-xs text-purple-600">Artist Member</p>
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="group flex items-center gap-3 px-6 py-3 bg-white/70 backdrop-blur-sm border border-gray-200 hover:border-red-200 text-gray-700 hover:text-red-600 rounded-2xl font-semibold transition-all duration-300 hover:shadow-lg"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs */}
        <div className="mb-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/20 inline-flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'plans' | 'history')}
                className={`flex items-center px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50/50'
                }`}
              >
                <tab.icon className="w-6 h-6 mr-3" />
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'plans' && <SubscriptionManager user={user} selectedPlan={selectedPlan} />}
          {activeTab === 'history' && <PaymentHistory user={user} />}
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we load your subscription details.</p>
        </div>
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  )
}