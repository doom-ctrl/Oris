import { env } from './env'
import { type NextRequest } from 'next/server'

// Content Security Policy
export const cspHeader = [
  // Default to self for security
  "default-src 'self'",

  // Scripts - allow self and unsafe-inline for development only
  process.env.NODE_ENV === 'development'
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
    : "script-src 'self'",

  // Styles - allow inline styles for TailwindCSS
  "style-src 'self' 'unsafe-inline'",

  // Images - allow self, data URLs, and Supabase storage
  `img-src 'self' data: blob: ${env.NEXT_PUBLIC_SUPABASE_URL}`,

  // Fonts - allow self and Google Fonts
  "font-src 'self' data:",

  // Connect - allow API endpoints and Supabase
  `connect-src 'self' ${env.NEXT_PUBLIC_SUPABASE_URL}`,

  // Frame-ancestors - prevent clickjacking
  "frame-ancestors 'none'",

  // Form-action - restrict to same origin
  "form-action 'self'",

  // Base-uri - restrict to same origin
  "base-uri 'self'",

  // Manifest - allow self
  "manifest-src 'self'",

  // Media - allow self and Supabase
  `media-src 'self' ${env.NEXT_PUBLIC_SUPABASE_URL}`,

  // Object - none for security
  "object-src 'none'",

  // Worker-src - self only
  "worker-src 'self'",

  // Upgrade insecure requests in production
  process.env.NODE_ENV === 'production' ? "upgrade-insecure-requests" : '',

].filter(Boolean).join('; ')

// Security Headers
export const securityHeaders = {
  // Content Security Policy
  'Content-Security-Policy': cspHeader,

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // XSS Protection
  'X-XSS-Protection': '1; mode=block',

  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', '),

  // Strict Transport Security (HTTPS only)
  ...(process.env.NODE_ENV === 'production' ? {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  } : {}),

  // Remove server information
  'Server': '',

  // Remove powered by header
  'X-Powered-By': '',
}

// Get client IP address from request
export function getClientIP(request: NextRequest): string {
  // Try various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const clientIP = request.headers.get('x-client-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIP) {
    return realIP.trim()
  }

  if (clientIP) {
    return clientIP.trim()
  }

  // Fallback to request IP
  return request.ip || 'unknown'
}

// Validate and sanitize input
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 1000) // Limit length
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate password strength
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Generate secure random token
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Check if request is from a bot
export function isBotRequest(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /perl/i,
    /php/i,
  ]

  return botPatterns.some(pattern => pattern.test(userAgent))
}

// Rate limiting middleware helper
export function createRateLimitMiddleware(options: {
  maxRequests?: number
  windowMs?: number
  skipSuccessfulRequests?: boolean
}) {
  const { maxRequests = 100, windowMs = 15 * 60 * 1000 } = options

  return async (request: NextRequest) => {
    const ip = getClientIP(request)

    // In a real implementation, you'd use Redis or a database
    // For now, we'll use a simple in-memory store
    const key = `rate-limit:${ip}`

    // This would be replaced with actual rate limiting logic
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests,
      resetTime: Date.now() + windowMs
    }
  }
}