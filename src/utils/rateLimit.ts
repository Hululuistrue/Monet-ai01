import { RateLimit } from '@/types'

const rateLimits = new Map<string, RateLimit>()

export function getRateLimit(identifier: string): RateLimit {
  const now = Date.now()
  const limit = rateLimits.get(identifier)
  
  if (!limit || now > limit.resetTime) {
    return { count: 0, resetTime: now + (60 * 60 * 1000) }
  }
  
  return limit
}

export function incrementRateLimit(identifier: string): RateLimit {
  const current = getRateLimit(identifier)
  const updated = { ...current, count: current.count + 1 }
  rateLimits.set(identifier, updated)
  return updated
}

export function isRateLimited(identifier: string, maxRequests: number): boolean {
  const limit = getRateLimit(identifier)
  return limit.count >= maxRequests
}

export function getGuestLimits() {
  return {
    daily: 3,
    hourly: 2
  }
}

export function getRegisteredUserLimits() {
  return {
    daily: 50,
    hourly: 10
  }
}