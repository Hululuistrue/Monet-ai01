'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff, Lock, CheckCircle } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isValidSession, setIsValidSession] = useState(false)
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    // Check if we have a valid reset session
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (session && !error) {
        setIsValidSession(true)
      } else {
        setError('Invalid or expired reset link. Please request a new password reset.')
      }
    }
    
    checkSession()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const validateForm = () => {
    if (!formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields')
      return false
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      })

      if (error) throw error

      setSuccess('Password updated successfully! Redirecting to login...')
      
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-xl animate-bounce"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,69,195,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,69,195,0.03)_1px,transparent_1px)] bg-[size:72px_72px]"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Back to Login Button */}
          <div className="mb-8">
            <Link
              href="/auth/login"
              className="group inline-flex items-center gap-3 px-6 py-3 bg-white/70 backdrop-blur-sm border border-gray-200/50 hover:border-purple-200 rounded-2xl transition-all duration-300 hover:shadow-lg transform hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
              <span className="font-semibold text-gray-700 group-hover:text-purple-700">Back to Login</span>
            </Link>
          </div>

          {/* Main Reset Card */}
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
                    <p className="text-sm text-gray-600">Reset Password</p>
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Create New Password</h2>
                <p className="text-gray-600">Enter your new password below</p>
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
              {isValidSession ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* New Password Field */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                      <Lock className="w-4 h-4 text-purple-500" />
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="w-full p-4 pr-12 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 placeholder-gray-400"
                        placeholder="Enter your new password"
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

                  {/* Confirm New Password Field */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                      <Lock className="w-4 h-4 text-purple-500" />
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="w-full p-4 pr-12 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 placeholder-gray-400"
                        placeholder="Confirm your new password"
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

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || success}
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
                          Updating Password...
                        </>
                      ) : success ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Password Updated!
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5" />
                          Update Password
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-pink-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                </form>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-500 text-2xl">❌</span>
                  </div>
                  <p className="text-gray-600 mb-6">This password reset link is invalid or has expired.</p>
                  <Link
                    href="/auth/login"
                    className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-2xl transition-colors"
                  >
                    Request New Reset Link
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}