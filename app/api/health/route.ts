import { NextRequest, NextResponse } from 'next/server'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()
    const checks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV,
      checks: {
        database: { status: 'unknown', responseTime: 0 },
        memory: { status: 'unknown', usage: 0 },
        disk: { status: 'unknown', usage: 0 },
      },
      responseTime: 0,
    }

    // Check database connection
    try {
      const dbStartTime = Date.now()
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase.from('profiles').select('id').limit(1)
      const dbResponseTime = Date.now() - dbStartTime

      checks.checks.database = {
        status: error ? 'unhealthy' : 'healthy',
        responseTime: dbResponseTime,
      }
    } catch (dbError) {
      checks.checks.database = {
        status: 'unhealthy',
        responseTime: 0,
        error: dbError instanceof Error ? dbError.message : 'Unknown database error',
      }
      checks.status = 'degraded'
    }

    // Check memory usage
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage()
      const totalMem = memUsage.heapTotal
      const usedMem = memUsage.heapUsed
      const memUsagePercent = (usedMem / totalMem) * 100

      checks.checks.memory = {
        status: memUsagePercent > 90 ? 'unhealthy' : memUsagePercent > 70 ? 'warning' : 'healthy',
        usage: Math.round(memUsagePercent),
        details: {
          used: Math.round(usedMem / 1024 / 1024), // MB
          total: Math.round(totalMem / 1024 / 1024), // MB
        },
      }

      if (memUsagePercent > 90) {
        checks.status = 'unhealthy'
      } else if (memUsagePercent > 70) {
        checks.status = 'degraded'
      }
    }

    // Calculate total response time
    checks.responseTime = Date.now() - startTime

    // Determine HTTP status based on overall health
    const statusCode = checks.status === 'healthy' ? 200 :
                      checks.status === 'degraded' ? 200 : 503

    return NextResponse.json(checks, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    })

  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown health check error',
      },
      { status: 503 }
    )
  }
}