import { NextRequest, NextResponse } from 'next/server'
import { getClientIP, isBotRequest } from '@/lib/security'
import { rateLimitByIP } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(request)
    const rateLimitResult = rateLimitByIP(ip, {
      maxRequests: 10,
      windowMs: 60000, // 1 minute
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          }
        }
      )
    }

    // Skip bot requests
    if (isBotRequest(request)) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    const errorData = await request.json()

    // Validate error data
    if (!errorData.message || !errorData.timestamp) {
      return NextResponse.json(
        { error: 'Invalid error data' },
        { status: 400 }
      )
    }

    // Sanitize error data
    const sanitizedData = {
      message: typeof errorData.message === 'string' ? errorData.message.slice(0, 500) : 'Unknown error',
      stack: typeof errorData.stack === 'string' ? errorData.stack.slice(0, 2000) : undefined,
      url: typeof errorData.url === 'string' ? errorData.url.slice(0, 2048) : undefined,
      userAgent: typeof errorData.userAgent === 'string' ? errorData.userAgent.slice(0, 500) : undefined,
      filename: typeof errorData.filename === 'string' ? errorData.filename.slice(0, 500) : undefined,
      lineno: typeof errorData.lineno === 'number' ? errorData.lineno : undefined,
      colno: typeof errorData.colno === 'number' ? errorData.colno : undefined,
      timestamp: errorData.timestamp,
      ip: ip,
      environment: process.env.NODE_ENV,
    }

    // Log error (in production, send to Sentry or similar)
    console.error('Client error reported:', sanitizedData)

    // Here you would send to your error tracking service
    // For example: Sentry.captureException(new Error(sanitizedData.message))

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('Error in error reporting API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}