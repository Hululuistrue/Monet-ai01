export interface GeneratedImage {
  id: string
  url: string
  thumbnail: string
  size: string
  created_at: string
  prompt: string
  user_id?: string
}

export interface GenerationRequest {
  prompt: string
  size?: '512x512' | '1024x1024'
  style?: 'natural' | 'vivid'
  quality?: 'standard' | 'hd'
  n?: number
}

export interface GenerationResponse {
  success: boolean
  data?: {
    images: GeneratedImage[]
    usage: {
      tokens: number
      cost: number
    }
  }
  error?: string
}

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface RateLimit {
  count: number
  resetTime: number
}