import { env } from './env'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting (in production, use Redis or similar)
const store: RateLimitStore = {}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 60000) // Clean up every minute

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

export function rateLimit(
  identifier: string,
  options: {
    maxRequests?: number
    windowMs?: number
  } = {}
): RateLimitResult {
  const {
    maxRequests = env.RATE_LIMIT_MAX_REQUESTS,
    windowMs = env.RATE_LIMIT_WINDOW_MS
  } = options

  const now = Date.now()
  const key = identifier

  // Initialize or get existing record
  if (!store[key] || store[key].resetTime < now) {
    store[key] = {
      count: 1,
      resetTime: now + windowMs
    }
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      resetTime: store[key].resetTime
    }
  }

  // Increment count
  store[key].count++

  const remaining = Math.max(0, maxRequests - store[key].count)
  const success = store[key].count <= maxRequests

  if (!success) {
    const retryAfter = Math.ceil((store[key].resetTime - now) / 1000)
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetTime: store[key].resetTime,
      retryAfter
    }
  }

  return {
    success: true,
    limit: maxRequests,
    remaining,
    resetTime: store[key].resetTime
  }
}

// Helper for IP-based rate limiting
export function rateLimitByIP(ip: string, options?: Parameters<typeof rateLimit>[1]) {
  return rateLimit(`ip:${ip}`, options)
}

// Helper for user-based rate limiting
export function rateLimitByUser(userId: string, options?: Parameters<typeof rateLimit>[1]) {
  return rateLimit(`user:${userId}`, options)
}

// Helper for endpoint-specific rate limiting
export function rateLimitEndpoint(
  identifier: string,
  endpoint: string,
  options?: Parameters<typeof rateLimit>[1]
) {
  return rateLimit(`${identifier}:${endpoint}`, options)
}