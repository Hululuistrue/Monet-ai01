import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'

// Simple SVG placeholder generator
function generatePlaceholderImage(prompt: string, error?: string) {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <rect width="100%" height="100%" fill="#6366f1"/>
    <rect x="10%" y="40%" width="80%" height="20%" fill="rgba(255,255,255,0.1)" rx="10"/>
    <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="system-ui" font-size="24" font-weight="bold">
      ${error ? 'Generation Failed' : 'Test Image'}
    </text>
    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-family="system-ui" font-size="16">
      ${prompt.slice(0, 50)}${prompt.length > 50 ? '...' : ''}
    </text>
    ${error ? `<text x="50%" y="65%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="system-ui" font-size="12">
      Error: ${error.slice(0, 30)}
    </text>` : ''}
  </svg>`
  
  return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({
        success: false,
        error: 'Prompt is required'
      }, { status: 400 })
    }

    // Environment check
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      const placeholderUrl = generatePlaceholderImage(prompt, 'Missing API Key')
      return NextResponse.json({
        success: true,
        data: {
          images: [{
            id: 'test-no-api',
            url: placeholderUrl,
            thumbnail: placeholderUrl
          }]
        },
        debug: {
          error: 'GOOGLE_AI_API_KEY not set',
          hasApiKey: false
        }
      })
    }

    // Try Gemini API
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: `Generate an image: ${prompt}` }]
        }]
      })

      const response = await result.response
      
      // Check for image data
      let hasImageData = false
      let imageUrl = null
      
      if (response.candidates && response.candidates[0]) {
        const candidate = response.candidates[0]
        if (candidate.content && candidate.content.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
              hasImageData = true
              const mimeType = part.inlineData.mimeType || 'image/jpeg'
              imageUrl = `data:${mimeType};base64,${part.inlineData.data}`
              break
            }
          }
        }
      }

      if (hasImageData && imageUrl) {
        return NextResponse.json({
          success: true,
          data: {
            images: [{
              id: 'test-gemini-success',
              url: imageUrl,
              thumbnail: imageUrl
            }]
          },
          debug: {
            source: 'gemini-2.0-flash-exp',
            hasApiKey: true,
            imageGenerated: true
          }
        })
      } else {
        // No image generated, return debug info
        const placeholderUrl = generatePlaceholderImage(prompt, 'No image in response')
        return NextResponse.json({
          success: true,
          data: {
            images: [{
              id: 'test-no-image',
              url: placeholderUrl,
              thumbnail: placeholderUrl
            }]
          },
          debug: {
            source: 'gemini-text-only',
            hasApiKey: true,
            imageGenerated: false,
            responseText: response.text(),
            candidatesCount: response.candidates?.length || 0
          }
        })
      }

    } catch (geminiError) {
      console.error('Gemini API error:', geminiError)
      const placeholderUrl = generatePlaceholderImage(prompt, 'Gemini API Error')
      
      return NextResponse.json({
        success: true,
        data: {
          images: [{
            id: 'test-error',
            url: placeholderUrl,
            thumbnail: placeholderUrl
          }]
        },
        debug: {
          source: 'error-fallback',
          hasApiKey: true,
          geminiError: geminiError instanceof Error ? geminiError.message : 'Unknown error'
        }
      })
    }

  } catch (error) {
    console.error('Test generate error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        errorType: error?.constructor?.name
      }
    }, { status: 500 })
  }
}