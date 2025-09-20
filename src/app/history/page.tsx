'use client'

import type { Metadata } from "next";
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Download, Heart, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface GeneratedImage {
  id: string
  prompt: string
  image_url: string
  thumbnail_url: string | null
  size: string
  created_at: string
  is_favorited: boolean
}

export default function HistoryPage() {
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      // Instead of redirecting, show a login prompt
      setLoading(false)
      setError('Please sign in to view your image history')
      return
    }
    
    setUser(session.user)
    await fetchHistory(session.access_token)
  }, [router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const fetchHistory = async (token: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const result = await response.json()
      if (result.success) {
        setImages(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to load history')
      console.error('History fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `ai-generated-${prompt.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(url)
    } catch {
      // Fallback
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `ai-generated-${Date.now()}.jpg`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const toggleFavorite = async (imageId: string, currentFavorited: boolean) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    try {
      const { error } = await supabase
        .from('generated_images')
        .update({ is_favorited: !currentFavorited })
        .eq('id', imageId)

      if (!error) {
        setImages(prev => prev.map(img => 
          img.id === imageId 
            ? { ...img, is_favorited: !currentFavorited }
            : img
        ))
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading your creations...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Generator
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Creations</h1>
            <p className="text-gray-600">View and manage your generated images</p>
          </div>
        </div>

        {error && error === 'Please sign in to view your image history' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-6">Please sign in to view your image generation history</p>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: `${window.location.origin}/history`
                    }
                  })
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
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
              <button
                onClick={() => router.push('/')}
                className="w-full bg-gray-600 text-white py-3 rounded-xl font-bold hover:bg-gray-700 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}

        {error && error !== 'Please sign in to view your image history' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {!error && images.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Images Yet</h2>
            <p className="text-gray-600 text-lg mb-6">You haven't generated any images yet. Start creating your first masterpiece!</p>
            <button
              onClick={() => router.push('/generate')}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
            >
              Generate Your First Image
            </button>
          </div>
        ) : !error ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <div key={image.id} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="aspect-square relative bg-gray-100">
                  <img
                    src={image.image_url}
                    alt={image.prompt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%236b7280'%3EImage not available%3C/text%3E%3C/svg%3E"
                    }}
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => toggleFavorite(image.id, image.is_favorited)}
                      className={`p-2 rounded-full shadow-md transition-colors ${
                        image.is_favorited 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white text-gray-600 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${image.is_favorited ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
                
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{image.prompt}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{image.size}</span>
                    <span>{new Date(image.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(image.image_url, image.prompt)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}