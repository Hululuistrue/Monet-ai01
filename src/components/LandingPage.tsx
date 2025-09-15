'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Sparkles, Zap, Shield, Users, Download, Share2, Palette, Globe, Check, Star, User, LogOut } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { supabase } from '@/lib/supabase'
import UserMenuDropdown from './UserMenuDropdown'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const features = [
  {
    icon: Sparkles,
    title: 'AI Image Generation',
    description: 'Transform text prompts into high-quality images using Gemini 2.5 Flash model',
    color: 'text-purple-600'
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Small images ≤6s, large images ≤10s. Experience ultra-fast creation',
    color: 'text-yellow-600'
  },
  {
    icon: Palette,
    title: 'Rich Templates',
    description: 'Sci-fi, anime, realistic and more style templates for quick start',
    color: 'text-pink-600'
  },
  {
    icon: Shield,
    title: 'Content Safety',
    description: 'Multi-layer filtering mechanisms ensure safe and compliant content',
    color: 'text-green-600'
  },
  {
    icon: Download,
    title: 'Multiple Formats',
    description: 'Download in PNG, JPG, WebP and other formats',
    color: 'text-blue-600'
  },
  {
    icon: Share2,
    title: 'One-Click Sharing',
    description: 'Share directly to social media platforms and showcase your creations',
    color: 'text-indigo-600'
  }
]

const useCases = [
  {
    name: 'Alex',
    role: 'Casual User',
    image: '👨‍💻',
    quote: 'So amazing! Just a few words and I get the images I want. My social media engagement is through the roof!',
    needs: 'Simple operation, fun sharing'
  },
  {
    name: 'Sarah',
    role: 'Content Creator',
    image: '👩‍🎨',
    quote: 'Provides endless inspiration for my blog and social media visuals.',
    needs: 'Style variety, batch generation'
  },
  {
    name: 'David',
    role: 'Designer',
    image: '🎨',
    quote: 'Advanced parameter control gives me precise adjustments, clear licensing lets me use confidently.',
    needs: 'Professional control, clear copyright'
  }
]

const pricingPlans = [
  {
    name: 'Free Trial',
    price: 'Free',
    period: '',
    description: 'Perfect for first-time users',
    features: [
      '3 generations per day',
      '2 generations per hour',
      'Standard image quality',
      'Basic download formats',
      'Community support'
    ],
    buttonText: 'Get Started',
    popular: false,
    cost: '~$0.117/day'
  },
  {
    name: 'Basic',
    price: '$9.99',
    period: '/month',
    description: 'Perfect for individual creators',
    features: [
      '50 generations per day',
      'Batch generate 2-4 images',
      'HD image quality',
      'Multiple download formats',
      'Favorites feature',
      'Priority support'
    ],
    buttonText: 'Choose Basic',
    popular: true,
    cost: ''
  },
  {
    name: 'Professional',
    price: '$19.99',
    period: '/month',
    description: 'Perfect for professional designers',
    features: [
      '200 generations per day',
      'Advanced parameter control',
      'Priority generation speed',
      'API access',
      'Commercial license',
      'Dedicated support'
    ],
    buttonText: 'Choose Professional',
    popular: false,
    cost: ''
  }
]

const examples = [
  { 
    prompt: 'Dreamy castle on a rainbow bridge', 
    style: 'Sci-Fi Style',
    image: '/images/examples/Dreamy castle on a rainbow bridge.png'
  },
  { 
    prompt: 'Cute cat playing in a garden', 
    style: 'Realistic Style',
    image: '/images/examples/Cute cat playing in a garden.png'
  },
  { 
    prompt: 'Neon night scene of a future city', 
    style: 'Cyberpunk',
    image: '/images/examples/Neon night scene of a future city.png'
  },
  { 
    prompt: 'Anime girl with cherry blossoms falling', 
    style: 'Anime Style',
    image: '/images/examples/Anime girl with cherry blossoms falling.png'
  }
]

export default function LandingPage() {
  const router = useRouter()
  const [activeExample, setActiveExample] = useState(0)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // 标记为客户端，防止 hydration 问题
    setIsClient(true)
    
    // Check current auth status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Auto-rotate examples every 4 seconds (只在客户端)
  useEffect(() => {
    if (!isClient) return
    
    const interval = setInterval(() => {
      setActiveExample((prev) => (prev + 1) % examples.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isClient])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handlePlanSelect = (planName: string) => {
    if (planName === 'Free Trial') {
      // Free plan goes directly to generation page
      router.push('/generate')
      return
    }

    // Paid plans require user login check first
    if (!user) {
      // Redirect to auth page with plan info and redirect URL if not logged in
      const planMapping: Record<string, string> = {
        'Basic': 'basic',
        'Professional': 'pro'
      }
      
      const planSlug = planMapping[planName]
      const redirectUrl = `/subscription?plan=${planSlug}`
      router.push(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}&plan=${planSlug}`)
      return
    }

    // Redirect logged-in users to subscription page
    const planMapping: Record<string, string> = {
      'Basic': 'basic',
      'Professional': 'pro'
    }
    
    const planSlug = planMapping[planName]
    if (planSlug) {
      router.push(`/subscription?plan=${planSlug}`)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-white/95 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-30 blur"></div>
                <div className="relative bg-white rounded-full p-4 shadow-lg">
                  <img src="/logo.png" alt="Monet-AI Image Generator" className="w-14 h-14 object-contain rounded-full" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Monet-AI Image Generator</span>
            </div>
            
            {/* Mobile auth button */}
            <div className="flex md:hidden">
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center space-x-1 px-3 py-2 text-sm bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-purple-600 transition-all duration-300 font-medium text-sm uppercase tracking-wider">Features</a>
              <a href="#use-cases" className="text-gray-600 hover:text-purple-600 transition-all duration-300 font-medium text-sm uppercase tracking-wider">Use Cases</a>
              <a href="#pricing" className="text-gray-600 hover:text-purple-600 transition-all duration-300 font-medium text-sm uppercase tracking-wider">Pricing</a>
              
              {user ? (
                <div className="flex items-center space-x-4">
                  <UserMenuDropdown 
                    user={user} 
                    onSignOut={handleSignOut}
                    showHistory={false}
                    size="sm"
                  />
                  <Link 
                    href="/generate" 
                    className="relative group bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105"
                  >
                    <span className="relative z-10">Start Creating</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/auth/login"
                    className="text-gray-600 hover:text-purple-600 transition-all duration-300 font-medium"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/generate" 
                    className="relative group bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/25 transform hover:scale-105 overflow-hidden"
                  >
                    <span className="relative z-10">Start Creating</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-xl animate-bounce"></div>
          <div className="absolute bottom-40 left-20 w-40 h-40 bg-gradient-to-r from-pink-400/20 to-purple-400/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-28 h-28 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 rounded-full blur-xl animate-bounce"></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(139,69,195,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,69,195,0.03)_1px,transparent_1px)] bg-[size:72px_72px]"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center space-x-4 bg-white/70 backdrop-blur-sm border border-purple-200/50 text-purple-700 px-8 py-4 rounded-full text-sm font-semibold mb-8 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="relative">
                <div className="w-12 h-12 bg-white rounded-full p-2 shadow-md group-hover:shadow-lg transition-all duration-300">
                  <img src="/logo.png" alt="Monet-AI Logo" className="w-full h-full object-contain rounded-full group-hover:animate-spin" />
                </div>
                <div className="absolute inset-0 bg-purple-400 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
              </div>
              <span className="bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">Powered by Gemini 2.5 Flash</span>
            </div>
            
            {/* Main Heading */}
            <div className="space-y-6 mb-8">
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black leading-tight">
                <span className="block text-gray-900 mb-4">Turn Ideas</span>
                <span className="block bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent animate-gradient-x">
                  Instantly
                </span>
                <span className="block text-gray-900 mt-4">Into Art</span>
              </h1>
            </div>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Transform your imagination into stunning visuals with Monet-AI. 
              <br className="hidden md:block" />
              <span className="text-purple-600 font-semibold">Professional quality</span> images inspired by artistic mastery.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Link 
                href="/generate"
                className="group relative bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 transform hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Start Creating Free
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
              </Link>
              
              <button 
                onClick={() => {
                  if (typeof document !== 'undefined') {
                    const exampleSection = document.getElementById('examples-section');
                    if (exampleSection) {
                      exampleSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                }}
                className="group border-2 border-gray-300 text-gray-700 px-10 py-5 rounded-2xl font-bold text-lg hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50 transition-all duration-300 transform hover:scale-105"
              >
                <span className="flex items-center gap-3">
                  View Examples
                  <div className="w-6 h-6 border-2 border-current rounded-full flex items-center justify-center group-hover:animate-pulse">
                    <div className="w-2 h-2 bg-current rounded-full"></div>
                  </div>
                </span>
              </button>
            </div>
            
            {/* Stats */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200/50">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <span className="font-semibold text-gray-700">10,000+ Active Users</span>
              </div>
              <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200/50">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                  <Globe className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-semibold text-gray-700">Multi-language Support</span>
              </div>
              <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200/50">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="font-semibold text-gray-700">4.9★ Rating</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex flex-col items-center space-y-2 animate-bounce">
            <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-gray-400 rounded-full mt-2 animate-pulse"></div>
            </div>
            <span className="text-xs text-gray-400 font-medium">Scroll to explore</span>
          </div>
        </div>

        <style jsx>{`
          @keyframes gradient-x {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .animate-gradient-x {
            background-size: 200% 200%;
            animation: gradient-x 3s ease infinite;
          }
        `}</style>
      </section>

      {/* Example Generation Section */}
      <section id="examples-section" className="py-28 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block mb-6">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent text-sm font-bold uppercase tracking-wider">AI Showcase</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6">
              See What AI 
              <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Can Create
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore different styles and witness the power of AI image generation in action
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Interactive prompts */}
            <div className="space-y-4">
              {examples.map((example, index) => (
                <div
                  key={index}
                  className={cn(
                    "group p-6 rounded-2xl cursor-pointer transition-all duration-500 transform hover:scale-[1.02]",
                    activeExample === index 
                      ? "bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 shadow-lg shadow-purple-500/10" 
                      : "bg-white border-2 border-gray-100 hover:border-purple-100 hover:shadow-md"
                  )}
                  onClick={() => setActiveExample(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                          activeExample === index 
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg" 
                            : "bg-gray-100 group-hover:bg-purple-100"
                        )}>
                          <Sparkles className={cn(
                            "w-6 h-6 transition-all duration-300",
                            activeExample === index ? "text-white" : "text-gray-500 group-hover:text-purple-500"
                          )} />
                        </div>
                        <div>
                          <p className={cn(
                            "font-bold text-lg transition-colors duration-300",
                            activeExample === index ? "text-gray-900" : "text-gray-700"
                          )}>
                            "{example.prompt}"
                          </p>
                          <p className={cn(
                            "text-sm font-semibold transition-colors duration-300",
                            activeExample === index ? "text-purple-600" : "text-gray-500"
                          )}>
                            {example.style}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "w-4 h-4 rounded-full transition-all duration-300",
                      activeExample === index 
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg scale-125" 
                        : "bg-gray-300 group-hover:bg-purple-300"
                    )} />
                  </div>
                  
                  {/* Progress bar */}
                  <div className={cn(
                    "h-1 bg-gray-200 rounded-full mt-4 overflow-hidden transition-all duration-300",
                    activeExample === index ? "opacity-100" : "opacity-0"
                  )}>
                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Right side - Image showcase */}
            <div className="relative">
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden group">
                {/* Image Container */}
                <div className="relative h-[500px] overflow-hidden">
                  <img 
                    src={examples[activeExample].image} 
                    alt={examples[activeExample].prompt}
                    className="w-full h-full object-cover transition-all duration-700 ease-out transform group-hover:scale-105"
                    loading="lazy"
                    style={{
                      filter: 'brightness(1.05) contrast(1.02)',
                      imageRendering: 'crisp-edges'
                    }}
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.imageRendering = 'crisp-edges';
                    }}
                  />
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80"></div>
                  
                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 bg-purple-500/80 backdrop-blur-sm rounded-full flex items-center justify-center mr-3">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-purple-300 uppercase tracking-wider">
                        {examples[activeExample].style}
                      </span>
                    </div>
                    <p className="text-2xl font-bold mb-2">"{examples[activeExample].prompt}"</p>
                    <div className="text-sm text-gray-300 flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      Generated in 3.2 seconds
                    </div>
                  </div>
                  
                  {/* Quality badge */}
                  <div className="absolute top-6 right-6">
                    <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
                      <span className="text-white text-sm font-bold">4K Quality</span>
                    </div>
                  </div>
                </div>
                
                {/* Navigation dots */}
                <div className="absolute top-6 left-6 flex space-x-3">
                  {examples.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveExample(index)}
                      className={cn(
                        "w-3 h-3 rounded-full transition-all duration-300",
                        activeExample === index 
                          ? "bg-white scale-125 shadow-lg" 
                          : "bg-white/40 hover:bg-white/70"
                      )}
                    />
                  ))}
                </div>
              </div>
              
              {/* Floating decoration elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-28 bg-gradient-to-b from-white to-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block mb-6">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent text-sm font-bold uppercase tracking-wider">
                Core Features
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6">
              Powerful Features,
              <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Simple Operation
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the next generation of AI image generation with cutting-edge technology and intuitive design
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group relative p-8 bg-white rounded-3xl border border-gray-100 hover:border-purple-200 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 transform hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl opacity-0 group-hover:opacity-30 blur transition-opacity duration-500 -z-10"></div>
                
                <div className="relative z-10">
                  {/* Icon container */}
                  <div className="mb-6">
                    <div className={cn(
                      "relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
                      "bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-white group-hover:to-gray-50",
                      "border border-gray-200 group-hover:border-purple-200",
                      "shadow-lg group-hover:shadow-xl group-hover:shadow-purple-500/20"
                    )}>
                      <feature.icon className={cn(
                        "w-8 h-8 transition-all duration-500",
                        feature.color,
                        "group-hover:scale-110"
                      )} />
                      
                      {/* Icon glow */}
                      <div className={cn(
                        "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur",
                        feature.color === 'text-purple-600' && "bg-purple-500",
                        feature.color === 'text-yellow-600' && "bg-yellow-500",
                        feature.color === 'text-pink-600' && "bg-pink-500",
                        feature.color === 'text-green-600' && "bg-green-500",
                        feature.color === 'text-blue-600' && "bg-blue-500",
                        feature.color === 'text-indigo-600' && "bg-indigo-500"
                      )}></div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-purple-900 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>
                  
                  {/* Decorative arrow */}
                  <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <ArrowRight className="w-5 h-5 text-purple-500" />
                  </div>
                  
                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-8 right-8 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-block mb-6">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent text-sm font-bold uppercase tracking-wider">
                User Stories
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6">
              Real Users,
              <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Real Success
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how creators worldwide are transforming their workflows with AI-powered image generation
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <div 
                key={index} 
                className="group relative bg-white rounded-3xl shadow-lg hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 transform hover:-translate-y-4 overflow-hidden"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Background pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-pink-50/30 to-indigo-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-500 -z-10"></div>
                
                <div className="relative z-10 p-8">
                  {/* User info */}
                  <div className="flex items-center mb-8">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 via-pink-100 to-indigo-100 flex items-center justify-center text-3xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                        {useCase.image}
                      </div>
                      {/* Avatar glow */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-500"></div>
                    </div>
                    <div className="ml-6">
                      <h4 className="text-2xl font-bold text-gray-900 group-hover:text-purple-900 transition-colors duration-300">
                        {useCase.name}
                      </h4>
                      <p className="text-purple-600 font-semibold text-sm uppercase tracking-wider">
                        {useCase.role}
                      </p>
                      {/* Role badge */}
                      <div className="mt-2 inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
                        ⭐ Verified User
                      </div>
                    </div>
                  </div>
                  
                  {/* Quote */}
                  <blockquote className="relative mb-6">
                    <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                      <span className="text-white text-lg font-bold">"</span>
                    </div>
                    <p className="text-gray-700 text-lg leading-relaxed italic font-medium group-hover:text-gray-800 transition-colors duration-300 pl-6">
                      {useCase.quote}
                    </p>
                  </blockquote>
                  
                  {/* Needs */}
                  <div className="border-t border-gray-100 pt-6">
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 font-medium">Core needs:</span>
                      <span className="ml-2 text-purple-600 font-semibold">{useCase.needs}</span>
                    </div>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-75 group-hover:scale-100">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  {/* Bottom accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Trust indicators */}
          <div className="mt-20 text-center">
            <div className="inline-flex items-center space-x-8 bg-white rounded-2xl px-8 py-6 shadow-lg border border-gray-100">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-900 font-bold">4.9/5</span>
                <span className="text-gray-600">User Rating</span>
              </div>
              <div className="w-px h-6 bg-gray-200"></div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span className="text-gray-900 font-bold">10K+</span>
                <span className="text-gray-600">Active Users</span>
              </div>
              <div className="w-px h-6 bg-gray-200"></div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-pink-600" />
                <span className="text-gray-900 font-bold">1M+</span>
                <span className="text-gray-600">Images Created</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Perfect Plan</h2>
            <p className="text-lg text-gray-600">From free experience to professional creation, there's always one that suits you</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 pricing-grid">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={cn(
                  "pricing-card group relative rounded-2xl p-8 transition-all duration-500 ease-in-out cursor-pointer",
                  "bg-white border border-gray-200",
                  "hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-4 hover:scale-105",
                  "hover:border-purple-300",
                  plan.popular 
                    ? "border-2 border-purple-300 shadow-lg shadow-purple-500/10 transform scale-105" 
                    : ""
                )}
                style={{
                  zIndex: plan.popular ? 2 : 1
                }}
              >
                {/* Animated Background Gradient */}
                <div className={cn(
                  "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500",
                  "bg-gradient-to-br from-purple-50/80 via-pink-50/80 to-indigo-50/80",
                  "group-hover:opacity-100"
                )} />
                
                {/* Glow Effect */}
                <div className={cn(
                  "absolute -inset-1 rounded-2xl opacity-0 transition-opacity duration-500",
                  "bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 blur",
                  "group-hover:opacity-30",
                  "-z-10"
                )} />

                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg animate-pulse whitespace-nowrap">
                      ⭐ Most Popular
                    </span>
                  </div>
                )}
                
                {/* Hover Icon */}
                <div className={cn(
                  "absolute top-4 right-4 w-8 h-8 rounded-full",
                  "bg-purple-100 flex items-center justify-center",
                  "opacity-0 scale-75 transition-all duration-300",
                  "group-hover:opacity-100 group-hover:scale-100"
                )}>
                  <ArrowRight className="w-4 h-4 text-purple-600" />
                </div>
                
                <div className="relative z-10">
                  <div className="text-center mb-8">
                    {/* Plan Icon */}
                    <div className={cn(
                      "w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-300",
                      "bg-gradient-to-br from-gray-100 to-gray-200",
                      "group-hover:from-purple-100 group-hover:to-pink-100",
                      "group-hover:shadow-lg group-hover:scale-110"
                    )}>
                      {index === 0 && <User className="w-8 h-8 text-gray-600 group-hover:text-purple-600 transition-colors duration-300" />}
                      {index === 1 && <Zap className="w-8 h-8 text-gray-600 group-hover:text-purple-600 transition-colors duration-300" />}
                      {index === 2 && <Shield className="w-8 h-8 text-gray-600 group-hover:text-purple-600 transition-colors duration-300" />}
                    </div>
                    
                    <h3 className={cn(
                      "text-2xl font-bold mb-2 transition-colors duration-300",
                      "text-gray-900 group-hover:text-purple-900"
                    )}>{plan.name}</h3>
                    
                    <p className={cn(
                      "mb-4 transition-colors duration-300",
                      "text-gray-600 group-hover:text-purple-700"
                    )}>{plan.description}</p>
                    
                    <div className="flex items-baseline justify-center mb-2">
                      <span className={cn(
                        "text-4xl font-bold transition-all duration-300",
                        "text-gray-900 group-hover:text-purple-600 group-hover:scale-110"
                      )}>{plan.price}</span>
                      <span className={cn(
                        "ml-1 transition-colors duration-300",
                        "text-gray-600 group-hover:text-purple-500"
                      )}>{plan.period}</span>
                    </div>
                    
                    {plan.cost && (
                      <p className="text-xs text-gray-500 group-hover:text-purple-400 transition-colors duration-300">{plan.cost}</p>
                    )}
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center group/item">
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center mr-3 transition-all duration-300",
                          "bg-green-100 group-hover:bg-green-200 group-hover:shadow-md"
                        )}>
                          <Check className="w-3 h-3 text-green-600 group-hover:text-green-700 transition-colors duration-300" />
                        </div>
                        <span className={cn(
                          "text-gray-600 group-hover:text-gray-800 transition-colors duration-300",
                          "group/item-hover:text-purple-700"
                        )}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <button 
                    onClick={() => handlePlanSelect(plan.name)}
                    className={cn(
                      "w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300",
                      "transform group-hover:scale-105 group-hover:shadow-lg",
                      "focus:outline-none focus:ring-4 focus:ring-purple-300",
                      plan.popular || index === 2
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg"
                        : "bg-gray-100 text-gray-900 hover:bg-purple-100 hover:text-purple-700 group-hover:bg-gradient-to-r group-hover:from-purple-100 group-hover:to-pink-100"
                    )}
                  >
                    <span className="flex items-center justify-center">
                      {plan.buttonText}
                      <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom CSS for advanced effects */}
        <style jsx>{`
          .pricing-grid {
            perspective: 1000px;
          }
          
          .pricing-card {
            transform-style: preserve-3d;
          }
          
          .pricing-grid:hover .pricing-card:not(:hover) {
            opacity: 0.7;
            transform: scale(0.95);
            filter: blur(1px);
          }
          
          @media (max-width: 768px) {
            .pricing-grid:hover .pricing-card:not(:hover) {
              opacity: 1;
              transform: none;
              filter: none;
            }
          }
        `}</style>
      </section>

      {/* CTA Section */}
      <section className="relative py-28 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/5 rounded-full blur-xl animate-bounce"></div>
        
        <div className="relative max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          {/* Badge */}
          <div className="inline-flex items-center space-x-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-full text-sm font-semibold mb-8">
            <div className="w-12 h-12 bg-white/20 rounded-full p-2 backdrop-blur-sm">
              <img src="/logo.png" alt="Monet-AI Logo" className="w-full h-full object-contain rounded-full" />
            </div>
            <span>Join the AI Revolution</span>
          </div>
          
          {/* Heading */}
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-tight">
            Ready to Start Your
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Creative Journey?
            </span>
          </h2>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-purple-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of creators and transform your imagination into reality with Monet-AI. 
            <br className="hidden md:block" />
            <span className="text-white font-semibold">Start creating stunning visuals inspired by artistic mastery.</span>
          </p>
          
          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link 
              href="/generate"
              className="group relative bg-white text-purple-600 px-12 py-6 rounded-2xl font-bold text-xl transition-all duration-300 hover:shadow-2xl hover:shadow-white/20 transform hover:scale-105 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Start Creating Free
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-white/80">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span className="font-medium">100% Secure</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span className="font-medium">Instant Results</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="w-5 h-5" />
              <span className="font-medium">No Credit Card Required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gray-900 text-gray-300 py-20 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,69,195,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,69,195,0.05)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-12">
            {/* Brand section */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-30 blur"></div>
                  <div className="relative bg-gray-800 rounded-full p-4 border border-gray-700 shadow-lg">
                    <img src="/logo.png" alt="Monet-AI Image Generator" className="w-16 h-16 object-contain rounded-full" />
                  </div>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Monet-AI Image Generator
                </span>
              </div>
              <p className="text-gray-400 leading-relaxed text-lg mb-8">
                Monet-AI is the most advanced AI image generation platform, inspired by the artistic mastery of Claude Monet. Transform your ideas into stunning visuals with cutting-edge technology and intuitive design.
              </p>
              
              {/* Social proof */}
              <div className="flex items-center space-x-6 mb-8">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-400">10K+ Active Users</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-400">4.9/5 Rating</span>
                </div>
              </div>
            </div>
            
            {/* Product links */}
            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Product</h4>
              <ul className="space-y-4">
                <li>
                  <a href="/generate" className="text-gray-400 hover:text-purple-400 transition-colors duration-300 flex items-center group">
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Image Generation
                  </a>
                </li>
                <li>
                  <a href="#features" className="text-gray-400 hover:text-purple-400 transition-colors duration-300 flex items-center group">
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-gray-400 hover:text-purple-400 transition-colors duration-300 flex items-center group">
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Pricing Plans
                  </a>
                </li>
              </ul>
            </div>
            
            {/* Support links */}
            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Support</h4>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors duration-300 flex items-center group">
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors duration-300 flex items-center group">
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors duration-300 flex items-center group">
                    <ArrowRight className="w-4 h-4 mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    Community
                  </a>
                </li>
              </ul>
            </div>
            
          </div>
          
          {/* Bottom bar */}
          <div className="border-t border-gray-800 mt-16 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-8">
                <p className="text-gray-400">
                  &copy; 2025 Monet-AI Image Generator. All rights reserved.
                </p>
                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                  <span>Made with</span>
                  <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                  <span>by AI Innovation Team</span>
                </div>
              </div>
              
              {/* Back to top */}
              <button 
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="group flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-6 py-3 rounded-full transition-all duration-300 border border-gray-700 hover:border-purple-500"
              >
                <span className="text-sm font-medium">Back to top</span>
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <ArrowRight className="w-3 h-3 text-white -rotate-90" />
                </div>
              </button>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-full blur-2xl"></div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-r from-indigo-600/10 to-blue-600/10 rounded-full blur-2xl"></div>
      </footer>

    </div>
  )
}