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
    hourly: 2,
    maxBatchSize: 2,
    maxDownloads: 1,
    quality: 'standard',
    queuePriority: 'standard'
  }
}

export function getFreePlanLimits() {
  return {
    daily: 10,
    hourly: 2,
    maxBatchSize: 2,
    maxDownloads: 2,
    quality: 'standard',
    queuePriority: 'standard'
  }
}

export function getPlanLimits(planName: string) {
  switch (planName) {
    case 'guest':
      return getGuestLimits()
    case 'free':
      return getFreePlanLimits()
    case 'basic':
      return {
        daily: 50,
        hourly: 10,
        maxBatchSize: 4,
        maxDownloads: 4,
        quality: 'hd',
        queuePriority: 'standard'
      }
    case 'pro':
      return {
        daily: 200,
        hourly: 20,
        maxBatchSize: 6,
        maxDownloads: 6,
        quality: 'hd',
        queuePriority: 'high'
      }
    default:
      return getGuestLimits()
  }
}