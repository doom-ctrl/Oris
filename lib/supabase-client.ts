import { createBrowserClient } from '@supabase/ssr'
import { env, isSupabaseConfigured } from '@/lib/env'

/**
 * Creates a Supabase client configured with anon key for client-side use.
 * The anon key is safe to use in the browser as it has limited permissions.
 */
export function createBrowserSupabaseClient() {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase is not configured. Please check your environment variables.')
    return null
  }

  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    }
  )
}

/**
 * Creates a Supabase client for specific use cases with custom options
 */
export function createCustomSupabaseClient(options?: {
  auth?: {
    persistSession?: boolean
    autoRefreshToken?: boolean
    detectSessionInUrl?: boolean
  }
}) {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase is not configured. Please check your environment variables.')
    return null
  }

  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        ...options?.auth
      }
    }
  )
}

// Helper function to check if Supabase client is available
export const isSupabaseClientAvailable = () => {
  return isSupabaseConfigured()
}