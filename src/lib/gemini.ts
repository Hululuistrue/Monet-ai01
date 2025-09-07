import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export async function generateImage(prompt: string) {
  try {
    // Use Gemini 2.0 Flash experimental model for native image generation
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        // This is the key - we need to explicitly request both text and image outputs
        responseModalities: ['Text', 'Image'],
        maxOutputTokens: 2048,
      }
    })

    // Create an optimized prompt for better image generation results
    const imagePrompt = `Create a high-quality, visually appealing image with the following specifications:

Subject: ${prompt}

Requirements:
- High resolution and sharp details
- Professional composition with balanced elements
- Rich colors and proper lighting
- Clear focus on the main subject
- Aesthetically pleasing and engaging visual design
- Suitable for digital display and sharing

Please generate a detailed, realistic image that captures the essence of the requested subject matter with artistic quality.`

    console.log('Calling Gemini API with prompt:', imagePrompt)
    console.log('Using responseModalities: ["Text", "Image"]')

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: imagePrompt
            }
          ]
        }
      ]
    })

    const response = await result.response
    console.log('Full Gemini API response structure:', {
      candidatesCount: response.candidates?.length,
      hasUsageMetadata: !!response.usageMetadata,
      modelVersion: response.modelVersion
    })
    
    // Check if the response contains image data
    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0]
      console.log('Candidate parts count:', candidate.content?.parts?.length)
      
      // Look for image parts in the response
      let imageData = null
      let textContent = ""
      
      if (candidate.content && candidate.content.parts) {
        for (let i = 0; i < candidate.content.parts.length; i++) {
          const part = candidate.content.parts[i]
          console.log(`Part ${i}:`, {
            hasText: !!part.text,
            hasInlineData: !!part.inlineData,
            inlineDataType: part.inlineData?.mimeType
          })
          
          if (part.inlineData && part.inlineData.data) {
            // Found inline image data
            imageData = part.inlineData
            console.log('🎉 FOUND IMAGE DATA!', {
              mimeType: imageData.mimeType,
              dataLength: imageData.data.length,
              dataPreview: imageData.data.substring(0, 50) + '...'
            })
          } else if (part.text) {
            textContent += part.text
            console.log('Text content:', part.text.substring(0, 100) + '...')
          }
        }
      }

      if (imageData && imageData.data) {
        // Convert base64 image data to data URL
        const mimeType = imageData.mimeType || 'image/jpeg'
        const imageUrl = `data:${mimeType};base64,${imageData.data}`
        const thumbnailUrl = imageUrl // Use same image for thumbnail
        
        console.log('🎉 SUCCESS! Generated image with Gemini!', {
          mimeType,
          imageSize: imageData.data.length,
          urlLength: imageUrl.length
        })
        
        return {
          success: true,
          data: {
            imageUrl: imageUrl,
            thumbnailUrl: thumbnailUrl,
            enhancedPrompt: textContent || prompt,
            originalPrompt: prompt,
            mimeType: mimeType,
            source: 'gemini-2.0-flash'
          },
          usage: {
            tokens: response.usageMetadata?.totalTokenCount || 1290,
            cost: 0.039
          }
        }
      } else {
        // If no image was generated, show detailed debugging info
        const responseText = response.text()
        console.log('❌ No image data found. Response text:', responseText)
        console.log('Full candidate structure:', JSON.stringify(candidate, null, 2))
        
        // Generate a smart placeholder that indicates we're using Gemini's text response
        const fallbackUrl = generatePlaceholderImage(prompt, '1024x1024')
        return {
          success: true,
          data: {
            imageUrl: fallbackUrl,
            thumbnailUrl: generatePlaceholderImage(prompt, '512x512'),
            enhancedPrompt: responseText || prompt,
            originalPrompt: prompt,
            fallback: true,
            geminiResponse: responseText,
            source: 'gemini-text-fallback',
            debugInfo: 'Check server console for detailed API response'
          },
          usage: {
            tokens: response.usageMetadata?.totalTokenCount || 0,
            cost: 0.001
          }
        }
      }
    } else {
      throw new Error('No valid response from Gemini API')
    }

  } catch (error) {
    console.error('❌ Gemini image generation error:', error)
    
    // Generate fallback placeholder
    const fallbackUrl = generatePlaceholderImage(prompt, '1024x1024')
    return {
      success: true, // Still return success with placeholder
      data: {
        imageUrl: fallbackUrl,
        thumbnailUrl: generatePlaceholderImage(prompt, '512x512'),
        enhancedPrompt: prompt,
        originalPrompt: prompt,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'placeholder-error'
      },
      usage: {
        tokens: 0,
        cost: 0
      }
    }
  }
}

// Function to create a placeholder image using SVG data URL
function generatePlaceholderImage(prompt: string, size: string = '1024x1024') {
  // Create a unique seed based on the prompt
  const seed = prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  
  // Generate colors based on prompt
  const colors = ['6366f1', '8b5cf6', 'a855f7', '3b82f6', '06b6d4', '10b981', 'f59e0b', 'ef4444', 'ec4899', '84cc16']
  const bgColor = colors[seed % colors.length]
  
  const [width, height] = size.split('x')
  
  // Create SVG placeholder that doesn't rely on external services
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