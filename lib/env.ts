import { z } from 'zod'

const envSchema = z.object({
  // Supabase - make optional in development, required in production
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Oris"),

  // Monitoring (optional in development)
  SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Analytics (optional)
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_VERCEL_ANALYTICS_ID: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_MAX_REQUESTS: z.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.number().default(900000),

  // Feature Flags
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().transform(val => val === "true").default("false"),
  NEXT_PUBLIC_ENABLE_ERROR_REPORTING: z.string().transform(val => val === "true").default("false"),
  NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING: z.string().transform(val => val === "true").default("false"),

  // Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

// Validate and export environment variables with better error handling
const envResult = envSchema.safeParse({
  ...process.env,
  // Convert string environment variables to proper types
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"),
  // Convert string booleans to actual booleans for feature flags
})

const parsedEnv = envResult.success ? envResult.data : {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_APP_NAME: 'Oris',
  SENTRY_DSN: process.env.SENTRY_DSN,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_VERCEL_ANALYTICS_ID: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID,
  RATE_LIMIT_MAX_REQUESTS: 100,
  RATE_LIMIT_WINDOW_MS: 900000,
  NEXT_PUBLIC_ENABLE_ANALYTICS: false,
  NEXT_PUBLIC_ENABLE_ERROR_REPORTING: false,
  NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING: false,
  NODE_ENV: 'development',
}

// Add production validation
if (process.env.NODE_ENV === 'production') {
  if (!parsedEnv.NEXT_PUBLIC_SUPABASE_URL || !parsedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing required Supabase environment variables in production')
  }
}

export const env = parsedEnv

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (feature: keyof Pick<Env, 'NEXT_PUBLIC_ENABLE_ANALYTICS' | 'NEXT_PUBLIC_ENABLE_ERROR_REPORTING' | 'NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING'>) => {
  return env[feature]
}

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Helper to get public environment variables (safe to expose to client)
export const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_NAME: env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_POSTHOG_KEY: env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_VERCEL_ANALYTICS_ID: env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID,
  NEXT_PUBLIC_ENABLE_ANALYTICS: env.NEXT_PUBLIC_ENABLE_ANALYTICS,
  NEXT_PUBLIC_ENABLE_ERROR_REPORTING: env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING,
  NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING: env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING,
  NODE_ENV: env.NODE_ENV,
}

