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
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/')
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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {images.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <p className="text-gray-600 text-lg mb-4">No images generated yet</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Generate Your First Image
            </button>
          </div>
        ) : (
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