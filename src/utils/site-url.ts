/**
 * Get the correct site URL for email redirects
 * Prioritizes environment variable, falls back to window.location.origin in browser
 */
export function getSiteUrl(): string {
  // In production, use the environment variable
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  
  // Check for Vercel's automatic environment variables
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // In browser, use window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // Production fallback - use your actual domain
  if (process.env.NODE_ENV === 'production') {
    return 'https://www.monet-ai.top'
  }
  
  // Development fallback
  return 'http://localhost:3000'
}