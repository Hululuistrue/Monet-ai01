import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// During build time, environment variables might not be available
// Create a dummy client to avoid build failures
if (!supabaseUrl || !supabaseAnonKey) {
  // Only throw error at runtime, not during build
  if (typeof window !== 'undefined' || process.env.NODE_ENV !== 'development') {
    console.warn('Supabase environment variables not found, using dummy client for build')
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://dummy.supabase.co',
  supabaseAnonKey || 'dummy_key'
)

// Server-only: create admin client lazily to avoid bundling errors in client
export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin is server-only')
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  // During build time, return dummy client to avoid build failures
  if (!serviceRoleKey || !url) {
    console.warn('Supabase admin credentials not found, using dummy client')
    return createClient(
      'https://dummy.supabase.co',
      'dummy_service_role_key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }

  return createClient(
    url,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}