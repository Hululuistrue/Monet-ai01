import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check environment variables
    const apiKey = process.env.GOOGLE_AI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'GOOGLE_AI_API_KEY environment variable is not set',
        debug: {
          hasApiKey: false,
          nodeEnv: process.env.NODE_ENV,
          vercelEnv: process.env.VERCEL_ENV
        }
      })
    }

    // Test Gemini API connection
    const genAI = new GoogleGenerativeAI(apiKey)
    
    // Test with a simple text model first
    const textModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    
    const testResult = await textModel.generateContent('Hello, test message')
    const testResponse = await testResult.response
    const testText = testResponse.text()

    // Test available models
    const availableModels = []
    try {
      // Try to get model info - this might not work with all API keys
      genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
      availableModels.push('gemini-2.0-flash-exp')
    } catch (e) {
      console.log('gemini-2.0-flash-exp not available:', e)
    }

    return NextResponse.json({
      success: true,
      debug: {
        hasApiKey: true,
        apiKeyLength: apiKey.length,
        apiKeyPrefix: apiKey.substring(0, 10) + '...',
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        testTextGeneration: {
          success: true,
          response: testText.substring(0, 100) + '...'
        },
        availableModels,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Gemini debug error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        hasApiKey: !!process.env.GOOGLE_AI_API_KEY,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        errorType: error?.constructor?.name,
        timestamp: new Date().toISOString()
      }
    })
  }
}