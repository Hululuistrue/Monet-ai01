'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Download, Sparkles, User, ArrowLeft } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { supabase } from '@/lib/supabase'
import AuthModal from './AuthModal'
import PromptTemplates from './PromptTemplates'
import UserMenuDropdown from './UserMenuDropdown'

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<Array<{id: string, url: string, thumbnail: string}>>([])
  const [error, setError] = useState<string | null>(null)
  const [generationInfo, setGenerationInfo] = useState<{source?: string, notice?: string} | null>(null)
  const [user, setUser] = useState<any>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [credits, setCredits] = useState<any>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  
  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [batchSize, setBatchSize] = useState(1)
  const [size, setSize] = useState('1024x1024')
  const [style, setStyle] = useState('natural')
  const [quality, setQuality] = useState('standard')

  const fetchCredits = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/credits', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()
      if (result.success) {
        setCredits(result.data)
      }
    } catch (err) {
      console.error('Failed to fetch credits:', err)
    }
  }, [])

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      setUser(session.user)
      setAuthToken(session.access_token)
      await fetchCredits(session.access_token)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user)
        setAuthToken(session.access_token)
        await fetchCredits(session.access_token)
      } else {
        setUser(null)
        setAuthToken(null)
        setCredits(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchCredits])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    
    setLoading(true)
    setError(null)
    setGenerationInfo(null)
    
    try {
      const headers: any = {
        'Content-Type': 'application/json',
      }
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: prompt.trim(),
          size,
          style,
          quality,
          n: batchSize
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        setGeneratedImages(result.data.images.map((img: any) => ({
          id: img.id,
          url: img.url,
          thumbnail: img.thumbnail || img.url
        })))
        
        // Set generation info if available (for AI-description based images)
        if (result.data.images.length > 0 && result.data.images[0].source) {
          const source = result.data.images[0].source
          if (source === 'gemini-description-svg') {
            setGenerationInfo({
              source: 'ai-description',
              notice: 'Generated visual representation based on AI description'
            })
          } else if (source?.includes('fallback')) {
            setGenerationInfo({
              source: 'fallback',
              notice: 'Using enhanced visual placeholder'
            })
          } else {
            setGenerationInfo(null)
          }
        } else {
          setGenerationInfo(null)
        }
        
        if (authToken) {
          await fetchCredits(authToken)
        }
      } else {
        setError(result.error || 'Failed to generate image')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Generation error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (imageUrl: string, imageId?: string) => {
    try {
      // For external URLs (like Unsplash), we need to handle CORS
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `ai-generated-${imageId || Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(url)
    } catch {
      // Fallback: try direct download
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `ai-generated-${imageId || Date.now()}.jpg`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
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

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <a
                href="/"
                className="group flex items-center gap-3 px-6 py-3 bg-white/70 backdrop-blur-sm border border-gray-200/50 hover:border-purple-200 rounded-2xl transition-all duration-300 hover:shadow-lg transform hover:scale-105"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
                <span className="font-semibold text-gray-700 group-hover:text-purple-700">Back to Home</span>
              </a>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-30 blur"></div>
                  <div className="relative bg-white rounded-full p-3 shadow-lg">
                    <img src="/logo.png" alt="Monet-AI Logo" className="w-12 h-12 object-contain rounded-full" />
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-gray-900">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Monet-AI
                    </span>
                    <span className="block text-2xl font-bold text-gray-700 mt-1">Image Generator</span>
                  </h1>
                </div>
              </div>
            </div>
            
            {/* User Area */}
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  {/* Credits Display */}
                  {credits && (
                    <div className="bg-white/50 backdrop-blur-sm rounded-2xl px-4 py-2 border border-gray-200/50">
                      <p className="text-xs text-purple-600 font-medium">
                        {credits.daily_remaining}/{credits.daily_limit} credits left
                      </p>
                    </div>
                  )}
                  
                  {/* User Menu Dropdown */}
                  <UserMenuDropdown 
                    user={user} 
                    onSignOut={handleSignOut}
                    showHistory={true}
                    size="md"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 transform hover:scale-105"
                >
                  <User className="w-5 h-5" />
                  Sign In
                </button>
              )}
            </div>
          </div>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your imagination into stunning visuals with <span className="font-semibold text-purple-600">artistic mastery</span>
          </p>
        </div>

        {/* Input Section */}
        <div className="relative group">
          {/* Glow Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-500 -z-10"></div>
          
          <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-12 border border-white/20">
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <label htmlFor="prompt" className="text-lg font-bold text-gray-800">
                    Describe your masterpiece
                  </label>
                </div>
                
                <PromptTemplates onSelectTemplate={setPrompt} />
                
                <div className="relative">
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A majestic mountain landscape at sunset with vibrant colors, painted in the style of Claude Monet..."
                    className="w-full p-6 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 resize-none h-32 text-gray-700 placeholder-gray-400 transition-all duration-300"
                    disabled={loading}
                  />
                  {/* Character count */}
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    {prompt.length}/500
                  </div>
                </div>
              </div>
              
              {/* Advanced Settings Toggle */}
              <div className="border-t border-gray-100 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="group flex items-center gap-3 text-gray-600 hover:text-purple-600 transition-colors duration-300"
                >
                  <div className="w-6 h-6 bg-gray-100 group-hover:bg-purple-100 rounded-full flex items-center justify-center transition-colors duration-300">
                    <span className={`text-sm transform transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`}>⚙️</span>
                  </div>
                  <span className="font-semibold">Advanced Settings</span>
                  <span className={`transform transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
                </button>
                
                {showAdvanced && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-2xl border border-purple-100/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                          <span>🎨</span>
                          Number of Images
                        </label>
                        <select
                          value={batchSize}
                          onChange={(e) => setBatchSize(Number(e.target.value))}
                          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
                        >
                          <option value={1}>1 masterpiece</option>
                          <option value={2}>2 masterpieces</option>
                          <option value={3}>3 masterpieces</option>
                          <option value={4}>4 masterpieces</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                          <span>📐</span>
                          Canvas Size
                        </label>
                        <select
                          value={size}
                          onChange={(e) => setSize(e.target.value)}
                          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
                        >
                          <option value="512x512">512×512 (Portrait Study)</option>
                          <option value="1024x1024">1024×1024 (Grand Canvas)</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                          <span>🎭</span>
                          Artistic Style
                        </label>
                        <select
                          value={style}
                          onChange={(e) => setStyle(e.target.value)}
                          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
                        >
                          <option value="natural">Natural Expression</option>
                          <option value="vivid">Vivid Impressions</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                          <span>✨</span>
                          Quality Level
                        </label>
                        <select
                          value={quality}
                          onChange={(e) => setQuality(e.target.value)}
                          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300"
                        >
                          <option value="standard">Gallery Standard</option>
                          <option value="hd">Museum Quality</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className={cn(
                  "group relative w-full py-6 px-8 rounded-2xl font-bold text-lg text-white transition-all duration-300 overflow-hidden",
                  "bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600",
                  "hover:shadow-2xl hover:shadow-purple-500/30 transform hover:scale-[1.02]",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
                  "flex items-center justify-center gap-3"
                )}
              >
                <span className="relative z-10 flex items-center gap-3">
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Creating {batchSize > 1 ? `${batchSize} masterpieces` : 'your masterpiece'}...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
                      Create {batchSize > 1 ? `${batchSize} Masterpieces` : 'Masterpiece'}
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-pink-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="relative mb-12">
            <div className="bg-red-50/80 backdrop-blur-sm border-2 border-red-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">!</span>
                </div>
                <p className="text-red-800 font-semibold">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Generated Images */}
        {generatedImages.length > 0 && (
          <div className="relative group mb-12">
            {/* Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl opacity-20 blur transition-opacity duration-500"></div>
            
            <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/30">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900">
                      Your Masterpiece{generatedImages.length > 1 ? 's' : ''}
                    </h2>
                    <p className="text-gray-600">Created with artistic mastery</p>
                  </div>
                </div>
                
                {generatedImages.length === 1 && (
                  <button
                    onClick={() => handleDownload(generatedImages[0].url, generatedImages[0].id)}
                    className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-bold transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/30 transform hover:scale-105"
                  >
                    <Download className="w-5 h-5 group-hover:animate-bounce" />
                    Download Masterpiece
                  </button>
                )}
              </div>
              
              {/* Generation Info Notice */}
              {generationInfo && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">
                        {generationInfo.source === 'ai-description' ? '🎨 AI-Enhanced Visual' : '✨ Enhanced Placeholder'}
                      </h4>
                      <p className="text-blue-800 text-sm">
                        {generationInfo.notice}
                        {generationInfo.source === 'ai-description' && (
                          <span className="block mt-1 text-blue-600">
                            Our AI analyzed your prompt and created this visual representation with enhanced styling.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className={`${generatedImages.length > 1 ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : ''}`}>
                {generatedImages.map((image, index) => (
                  <div key={image.id} className="relative group/image bg-gray-50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                    {/* Image Container */}
                    <div className="relative overflow-hidden">
                      <img
                        src={image.url}
                        alt={`Generated masterpiece ${index + 1}`}
                        className="w-full h-auto max-w-full mx-auto transition-transform duration-700 group-hover/image:scale-105"
                        onError={(e) => {
                          console.error('Image failed to load:', image.url)
                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%236b7280'%3EImage not available%3C/text%3E%3C/svg%3E"
                        }}
                      />
                      
                      {/* Image Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-4 left-4 right-4">
                          <p className="text-white font-bold text-lg">Masterpiece #{index + 1}</p>
                          <p className="text-white/80 text-sm">AI Generated Art</p>
                        </div>
                      </div>
                      
                      {/* Download Button for Multiple Images */}
                      {generatedImages.length > 1 && (
                        <div className="absolute top-4 right-4 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={() => handleDownload(image.url, image.id)}
                            className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg transition-all duration-300 transform hover:scale-110"
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Prompt Info */}
              <div className="mt-8 p-6 bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-2xl border border-purple-100/50">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">✨</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 mb-1">Creative Prompt:</p>
                      <p className="text-gray-700 leading-relaxed">{prompt}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="font-semibold">Canvas:</span> {size}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-semibold">Style:</span> {style}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-semibold">Quality:</span> {quality}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage Info */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-10 blur transition-opacity duration-500"></div>
          
          <div className="relative bg-blue-50/80 backdrop-blur-sm border-2 border-blue-200/50 rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">ℹ️</span>
              </div>
              <h3 className="text-2xl font-bold text-blue-900">Studio Limits</h3>
            </div>
            
            <div className="text-blue-700 space-y-3">
              {user ? (
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="font-semibold">Artist Membership:</span> 50 creations per day, max 10 per hour
                  </p>
                  {credits && (
                    <p className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      <span className="font-semibold">Remaining Today:</span> {credits.daily_remaining} masterpieces
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="font-semibold">Gallery:</span> All your creations are automatically preserved!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    <span className="font-semibold">Guest Access:</span> 3 creations per day, max 2 per hour
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="font-semibold">Member Benefits:</span> 50 creations per day, max 10 per hour
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span className="font-semibold">Join Free:</span> Unlock higher limits and save your artistic journey!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={(user) => {
            setUser(user)
            setShowAuthModal(false)
          }}
        />
      </div>
    </div>
  )
}