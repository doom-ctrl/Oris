import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if Supabase is properly configured
const isConfigured = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('undefined') &&
  !supabaseUrl.includes('xxxxx') &&
  !supabaseAnonKey.includes('undefined')
)

export const supabase = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null

export const isSupabaseConfigured = isConfigured