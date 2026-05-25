import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminSingleton: SupabaseClient | null = null

/**
 * Service-role Supabase client for trusted server code (API routes, server actions).
 * Never import this in client components.
 */
export function createAdminClient(): SupabaseClient {
  if (adminSingleton) return adminSingleton

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  }

  adminSingleton = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  return adminSingleton
}
