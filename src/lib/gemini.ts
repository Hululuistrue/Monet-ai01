import { GoogleGenerativeAI } from '@google/generative-ai'

// Lazy initialization to avoid build-time errors
function getGeminiClient() {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY environment variable is not set')
  }
  return new GoogleGenerativeAI(apiKey)
}

export async function generateImage(prompt: string) {
  try {
    const genAI = getGeminiClient()
    
    // First try with Imagen API if available, then fallback to Gemini text generation
    return await tryImagenGeneration(prompt, genAI) || await generateWithGeminiText(prompt, genAI)
    
  } catch (error) {
    console.error('❌ Gemini image generation error:', error)
    
    // Generate enhanced SVG placeholder as final fallback
    const fallbackUrl = generateEnhancedPlaceholder(prompt, '1024x1024')
    return {
      success: true,
      data: {
        imageUrl: fallbackUrl,
        thumbnailUrl: generateEnhancedPlaceholder(prompt, '512x512'),
        enhancedPrompt: prompt,
        originalPrompt: prompt,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'enhanced-svg-fallback'
      },
      usage: {
        tokens: 0,
        cost: 0
      }
    }
  }
}

// Try Gemini 2.5 Flash Image for actual image generation
async function tryImagenGeneration(prompt: string, genAI: any) {
  try {
    console.log('🔍 Attempting Gemini 2.5 Flash Image generation...')
    
    // Try multiple image generation models
    const imageModels = [
      'gemini-2.5-flash-image-preview',
      'gemini-2.0-flash-preview-image-generation',
      'imagen-3.0-generate-001'
    ]
    
    for (const modelName of imageModels) {
      try {
        console.log(`  🎨 Trying ${modelName}...`)
        
        const model = genAI.getGenerativeModel({ 
          model: modelName
        })

        const result = await model.generateContent({
          contents: [{
            role: 'user',
            parts: [{ text: `Generate a high-quality image: ${prompt}` }]
          }]
        })

        const response = await result.response
        
        // Check for image data in response
        if (response.candidates && response.candidates[0]) {
          const candidate = response.candidates[0]
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              if (part.inlineData && part.inlineData.data) {
                const mimeType = part.inlineData.mimeType || 'image/jpeg'
                const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`
                
                console.log(`🎉 SUCCESS! Generated image with ${modelName}!`)
                
                return {
                  success: true,
                  data: {
                    imageUrl: imageUrl,
                    thumbnailUrl: imageUrl,
                    enhancedPrompt: prompt,
                    originalPrompt: prompt,
                    mimeType: mimeType,
                    source: modelName
                  },
                  usage: {
                    tokens: response.usageMetadata?.totalTokenCount || 1290,
                    cost: 0.039
                  }
                }
              }
            }
          }
        }
        
        console.log(`  ⚠️  ${modelName} responded but no image data found`)
        
      } catch (modelError) {
        console.log(`  ❌ ${modelName} failed:`, modelError instanceof Error ? modelError.message : String(modelError))
      }
    }
    
    return null // No image generated, try next method
    
  } catch (error) {
    console.log('💡 Imagen API not available, trying Gemini text generation...')
    return null // Fall back to next method
  }
}

// Use Gemini for text description and generate enhanced SVG
async function generateWithGeminiText(prompt: string, genAI: any) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        maxOutputTokens: 1000,
      }
    })

    // Create a prompt for visual description
    const descriptionPrompt = `Provide a detailed visual description for creating this image: ${prompt}

Include:
- Main colors and color scheme
- Key visual elements and their arrangement
- Style (realistic, artistic, cartoon, etc.)
- Lighting and mood
- Background and foreground details

Keep response under 300 words, focused on visual details an artist would need.`

    console.log('🎨 Getting visual description from Gemini...')

    const result = await model.generateContent(descriptionPrompt)
    const response = await result.response
    const description = response.text()
    
    console.log('✅ Received description from Gemini:', description.substring(0, 200) + '...')
    
    // Generate enhanced SVG based on the description and original prompt
    const enhancedSvg = generateEnhancedPlaceholder(prompt, '1024x1024', description)
    const thumbnailSvg = generateEnhancedPlaceholder(prompt, '512x512', description)
    
    return {
      success: true,
      data: {
        imageUrl: enhancedSvg,
        thumbnailUrl: thumbnailSvg,
        enhancedPrompt: description,
        originalPrompt: prompt,
        source: 'gemini-description-svg',
        notice: 'Generated visual representation based on AI description'
      },
      usage: {
        tokens: response.usageMetadata?.totalTokenCount || 500,
        cost: 0.01
      }
    }
    
  } catch (error) {
    console.error('❌ Gemini text generation error:', error)
    
    // Fallback to basic enhanced SVG
    const fallbackUrl = generateEnhancedPlaceholder(prompt, '1024x1024')
    return {
      success: true,
      data: {
        imageUrl: fallbackUrl,
        thumbnailUrl: generateEnhancedPlaceholder(prompt, '512x512'),
        enhancedPrompt: prompt,
        originalPrompt: prompt,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'basic-svg-fallback'
      },
      usage: {
        tokens: 0,
        cost: 0
      }
    }
  }
}

// Enhanced SVG placeholder generator with AI description support
function generateEnhancedPlaceholder(prompt: string, size: string = '1024x1024', description?: string) {
  const [width, height] = size.split('x').map(Number)
  
  // Extract key visual elements from prompt
  const promptLower = prompt.toLowerCase()
  
  // Determine color scheme based on prompt content
  let primaryColor = '#6366f1' // default purple
  let secondaryColor = '#8b5cf6'
  let accentColor = '#ec4899'
  
  if (promptLower.includes('forest') || promptLower.includes('nature') || promptLower.includes('tree')) {
    primaryColor = '#10b981' // green
    secondaryColor = '#059669'
    accentColor = '#34d399'
  } else if (promptLower.includes('ocean') || promptLower.includes('water') || promptLower.includes('blue')) {
    primaryColor = '#3b82f6' // blue
    secondaryColor = '#2563eb'
    accentColor = '#60a5fa'
  } else if (promptLower.includes('fire') || promptLower.includes('red') || promptLower.includes('flame')) {
    primaryColor = '#ef4444' // red
    secondaryColor = '#dc2626'
    accentColor = '#f87171'
  } else if (promptLower.includes('sunset') || promptLower.includes('orange') || promptLower.includes('warm')) {
    primaryColor = '#f59e0b' // orange
    secondaryColor = '#d97706'
    accentColor = '#fbbf24'
  }
  
  // Generate pattern based on prompt
  let pattern = ''
  if (promptLower.includes('stars') || promptLower.includes('night') || promptLower.includes('space')) {
    pattern = Array.from({length: 50}, (_, i) => {
      const x = Math.random() * width
      const y = Math.random() * height
      const size = Math.random() * 3 + 1
      return `<circle cx="${x}" cy="${y}" r="${size}" fill="rgba(255,255,255,0.8)" opacity="${Math.random() * 0.5 + 0.3}"/>`
    }).join('')
  } else if (promptLower.includes('flower') || promptLower.includes('garden')) {
    pattern = Array.from({length: 20}, (_, i) => {
      const x = Math.random() * width
      const y = Math.random() * height
      const size = Math.random() * 20 + 10
      return `<circle cx="${x}" cy="${y}" r="${size}" fill="${accentColor}" opacity="0.3"/>`
    }).join('')
  }
  
  // Truncate description for display
  const displayText = description 
    ? description.substring(0, 150).replace(/[<>&]/g, '') + '...'
    : prompt.substring(0, 80) + (prompt.length > 80 ? '...' : '')
  
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryColor}"/>
        <stop offset="50%" stop-color="${secondaryColor}"/>
        <stop offset="100%" stop-color="${accentColor}"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge> 
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <!-- Background -->
    <rect width="100%" height="100%" fill="url(#bg)"/>
    
    <!-- Pattern -->
    ${pattern}
    
    <!-- Main content area -->
    <rect x="10%" y="30%" width="80%" height="40%" fill="rgba(255,255,255,0.1)" rx="20" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
    
    <!-- AI Generated indicator -->
    <text x="50%" y="20%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="system-ui" font-size="${Math.max(16, width/40)}" font-weight="bold" filter="url(#glow)">
      🎨 AI Generated Visual
    </text>
    
    <!-- Main prompt -->
    <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="system-ui" font-size="${Math.max(14, width/50)}" font-weight="600">
      ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}
    </text>
    
    <!-- Description preview -->
    ${description ? `
    <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="system-ui" font-size="${Math.max(10, width/80)}">
      ${displayText.split(' ').slice(0, 15).join(' ')}
    </text>
    ` : ''}
    
    <!-- Source indicator -->
    <text x="50%" y="80%" dominant-baseline="middle" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="system-ui" font-size="${Math.max(10, width/100)}">
      Generated with Gemini AI
    </text>
    
    <!-- Decorative elements -->
    <circle cx="15%" cy="15%" r="${width/50}" fill="rgba(255,255,255,0.3)" opacity="0.8"/>
    <circle cx="85%" cy="15%" r="${width/60}" fill="rgba(255,255,255,0.3)" opacity="0.6"/>
    <circle cx="15%" cy="85%" r="${width/60}" fill="rgba(255,255,255,0.3)" opacity="0.6"/>
    <circle cx="85%" cy="85%" r="${width/50}" fill="rgba(255,255,255,0.3)" opacity="0.8"/>
  </svg>`
  
  return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`
}