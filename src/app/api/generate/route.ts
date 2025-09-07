import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '@/lib/gemini'
import { supabase } from '@/lib/supabase'
import { validatePrompt, generateId } from '@/utils/helpers'
import { isRateLimited, incrementRateLimit, getGuestLimits } from '@/utils/rateLimit'
import { GenerationRequest } from '@/types'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

// Function to create a placeholder image using a more reliable service
function generatePlaceholderImage(prompt: string, size: string = '1024x1024') {
  const seed = prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const colors = ['6366f1', '8b5cf6', 'a855f7', '3b82f6', '06b6d4', '10b981', 'f59e0b', 'ef4444', 'ec4899', '84cc16']
  const bgColor = colors[seed % colors.length]
  
  const [width, height] = size.split('x')
  // Use a more reliable placeholder service or create SVG data URL
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#${bgColor}"/>
    <rect x="10%" y="40%" width="80%" height="20%" fill="rgba(255,255,255,0.1)" rx="10"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="system-ui" font-size="24" font-weight="bold">
      AI Generated Image
    </text>
    <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="system-ui" font-size="16">
      ${prompt.slice(0, 50)}${prompt.length > 50 ? '...' : ''}
    </text>
  </svg>`
  
  return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerationRequest = await request.json()
    const { prompt, size = '1024x1024', style = 'natural', quality = 'standard', n = 1 } = body

    if (!prompt) {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required'
      }, { status: 400 })
    }

    if (!validatePrompt(prompt)) {
      return NextResponse.json({
        success: false,
        error: 'Prompt contains inappropriate content'
      }, { status: 400 }) // 400 Bad Request
    }

    // Get user info or use headers for rate limiting
    const authHeader = request.headers.get('authorization')
    let userId: string | null = null
    let identifier = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
      if (user) {
        userId = user.id
        identifier = user.id
      }
    }

    // Check rate limits
    const limits = getGuestLimits()
    if (isRateLimited(identifier, limits.hourly)) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      }, { status: 429 }) // 429 Too Many Requests
    }

    // Generate image(s) using Gemini API - handle batch generation
    const results: any[] = []
    
    if (n === 1) {
      // Single image generation
      const result = await generateImage(prompt)
      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: (result as any).error || 'Failed to generate image'
        }, { status: 500 })
      }
      results.push(result)
    } else {
      // Batch generation - make multiple concurrent calls
      const batchPromises = Array(n).fill(null).map(() => generateImage(prompt))
      const batchResults = await Promise.allSettled(batchPromises)
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled' && result.value.success) {
          results.push(result.value)
        } else {
          console.error('Batch generation error:', result.status === 'rejected' ? result.reason : (result.value as any)?.error)
          // Add a failed result with placeholder
          results.push({
            success: true,
            data: {
              imageUrl: generatePlaceholderImage(prompt, size),
              thumbnailUrl: generatePlaceholderImage(prompt, '512x512'),
              enhancedPrompt: prompt,
              originalPrompt: prompt,
              fallback: true,
              source: 'batch-error-fallback'
            },
            usage: { tokens: 0, cost: 0 }
          })
        }
      }
    }

    if (results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate any images'
      }, { status: 500 })
    }

    // Increment rate limit
    incrementRateLimit(identifier)

    // Prepare images data for response and database
    const imagesData = results.map((result) => ({
      id: generateId(),
      url: result.data.imageUrl,
      thumbnail: result.data.thumbnailUrl,
      size,
      created_at: new Date().toISOString()
    }))

    // Save to database if user is authenticated
    if (userId && results.length > 0) {
      const dbRecords = imagesData.map((image, index) => ({
        id: image.id,
        user_id: userId,
        prompt,
        image_url: image.url,
        thumbnail_url: image.thumbnail,
        size,
        style,
        quality,
        tokens_used: results[index]?.usage?.tokens || 1290,
        cost: results[index]?.usage?.cost || 0.039
      }))

      const { error: dbError } = await supabase
        .from('generated_images')
        .insert(dbRecords)

      if (dbError) {
        console.error('Database error:', dbError)
      }
    }

    // Calculate total usage
    const totalTokens = results.reduce((sum, result) => sum + (result.usage?.tokens || 1290), 0)
    const totalCost = results.reduce((sum, result) => sum + (result.usage?.cost || 0.039), 0)

    return NextResponse.json({
      success: true,
      data: {
        images: imagesData,
        usage: {
          tokens: totalTokens,
          cost: totalCost
        }
      }
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}