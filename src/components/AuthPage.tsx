'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Sparkles, CheckCircle } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  })

  // Get redirect info from URL params
  const redirectTo = searchParams.get('redirect') || '/generate'
  const planName = searchParams.get('plan')
  const errorParam = searchParams.get('error')

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // User is already logged in, redirect
        router.push(redirectTo)
      }
    }
    
    // Handle error from URL params
    if (errorParam === 'auth_failed') {
      setError('Authentication failed. Please try again.')
    }
    
    checkAuth()
  }, [router, redirectTo, errorParam])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields')
      return false
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address')
      return false
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }

    if (!isLogin) {
      if (!formData.fullName.trim()) {
        setError('Please enter your full name')
        return false
      }
      
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isLogin) {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })

        if (error) throw error

        if (data.user) {
          setSuccess('Welcome back! Redirecting...')
          setTimeout(() => {
            router.push(redirectTo)
          }, 1500)
        }
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName
            }
          }
        })

        if (error) throw error

        if (data.user) {
          setSuccess('Account created successfully! Please check your email to verify your account.')
        }
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${isLogin ? 'sign in' : 'sign up'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Please enter your email address first')
      return
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error

      setSuccess('Password reset email sent! Check your inbox.')
      setShowForgotPassword(false)
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    try {
      // Store redirect URL in localStorage for callback
      if (redirectTo !== '/generate') {
        localStorage.setItem('authRedirect', redirectTo)
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google')
    }
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

      <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Back to Home Button */}
          <div className="mb-8">
            <Link
              href="/"
              className="group inline-flex items-center gap-3 px-6 py-3 bg-white/70 backdrop-blur-sm border border-gray-200/50 hover:border-purple-200 rounded-2xl transition-all duration-300 hover:shadow-lg transform hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
              <span className="font-semibold text-gray-700 group-hover:text-purple-700">Back to Home</span>
            </Link>
          </div>

          {/* Main Auth Card */}
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-500 -z-10"></div>
            
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-30 blur"></div>
                    <div className="relative bg-white rounded-full p-3 shadow-lg">
                      <img src="/logo.png" alt="Monet-AI Logo" className="w-12 h-12 object-contain rounded-full" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-gray-900">
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Monet-AI
                      </span>
                    </h1>
                    <p className="text-sm text-gray-600">Artistic Image Generation</p>
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {isLogin ? 'Welcome Back' : 'Join the Studio'}
                </h2>
                <p className="text-gray-600">
                  {isLogin 
                    ? 'Sign in to continue your artistic journey'
                    : 'Create your account and start generating masterpieces'
                  }
                </p>
                
                {planName && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl border border-purple-200/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-purple-800">Selected Plan</p>
                        <p className="text-lg font-bold text-purple-700 capitalize">{planName} Plan</p>
                      </div>
                    </div>
                    <p className="text-xs text-purple-600 mt-2">Sign in to activate your subscription</p>
                  </div>
                )}
              </div>

              {/* Success Message */}
              {success && (
                <div className="mb-6 p-4 bg-green-50/80 backdrop-blur-sm border-2 border-green-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <p className="text-green-800 font-medium">{success}</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border-2 border-red-200 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs">!</span>
                    </div>
                    <p className="text-red-800 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name Field (Register Only) */}
                {!isLogin && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                      <User className="w-4 h-4 text-purple-500" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 placeholder-gray-400"
                      placeholder="Enter your full name"
                      disabled={loading}
                    />
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Mail className="w-4 h-4 text-purple-500" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 placeholder-gray-400"
                    placeholder="Enter your email"
                    disabled={loading}
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                    <Lock className="w-4 h-4 text-purple-500" />
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full p-4 pr-12 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 placeholder-gray-400"
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field (Register Only) */}
                {!isLogin && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                      <Lock className="w-4 h-4 text-purple-500" />
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="w-full p-4 pr-12 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 placeholder-gray-400"
                        placeholder="Confirm your password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "group relative w-full py-4 px-8 rounded-2xl font-bold text-lg text-white transition-all duration-300 overflow-hidden",
                    "bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600",
                    "hover:shadow-2xl hover:shadow-purple-500/30 transform hover:scale-[1.02]",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  )}
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                        {isLogin ? 'Sign In to Studio' : 'Join the Studio'}
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-pink-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                </button>
              </form>

              {/* Forgot Password */}
              {isLogin && (
                <div className="mt-4 text-center">
                  {showForgotPassword ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">Enter your email to receive password reset instructions</p>
                      <button
                        onClick={handleForgotPassword}
                        disabled={loading}
                        className="w-full py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50"
                      >
                        {loading ? 'Sending...' : 'Send Reset Email'}
                      </button>
                      <button
                        onClick={() => setShowForgotPassword(false)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-purple-600 hover:text-pink-600 font-semibold transition-colors"
                    >
                      Forgot your password?
                    </button>
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="my-8 flex items-center">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-4 text-sm text-gray-500 font-medium">or</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              {/* Google OAuth */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full p-4 border-2 border-gray-200 rounded-2xl hover:border-purple-200 hover:bg-purple-50/50 transition-all duration-300 flex items-center justify-center gap-3 font-semibold text-gray-700 hover:text-purple-700"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              {/* Toggle Form Type */}
              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin)
                      setError(null)
                      setSuccess(null)
                      setFormData({
                        email: '',
                        password: '',
                        confirmPassword: '',
                        fullName: ''
                      })
                    }}
                    className="ml-2 font-bold text-purple-600 hover:text-pink-600 transition-colors"
                  >
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}