/**
 * Get the correct site URL for email redirects
 * Auto-detects from VERCEL_URL, NEXT_PUBLIC_SITE_URL, or current domain
 */
export function getSiteUrl(): string {
  // 1. Check if explicitly set in environment
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL
  }
  
  // 2. Auto-detect from Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // 3. Auto-detect from Vercel branch deployment URL  
  if (process.env.VERCEL_BRANCH_URL) {
    return `https://${process.env.VERCEL_BRANCH_URL}`
  }
  
  // 4. In browser, use current domain
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // 5. Fallback for local development
  return 'http://localhost:3000'
}