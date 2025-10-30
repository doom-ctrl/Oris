'use client'

import { useEffect } from 'react'
import { env } from '@/lib/env'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

export function ErrorBoundary({ children, fallback: Fallback }: ErrorBoundaryProps) {
  useEffect(() => {
    // Global error handler
    const handleError = (event: ErrorEvent) => {
      if (env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING) {
        // Send to external service
        sendErrorToService({
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        })
      }
    }

    // Unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING) {
        sendErrorToService({
          message: event.reason?.message || 'Unhandled promise rejection',
          stack: event.reason?.stack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        })
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  // Simple error boundary implementation
  return <>{children}</>
}

async function sendErrorToService(errorData: any) {
  try {
    // Send to your error tracking service
    if (env.SENTRY_DSN && env.SENTRY_AUTH_TOKEN) {
      // Would integrate with Sentry here
      // For now, send to a simple API endpoint
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      })
    }
  } catch (err) {
    // Fail silently for error reporting
    console.error('Failed to send error report:', err)
  }
}

// Performance monitoring
export function PerformanceTracker() {
  useEffect(() => {
    if (!env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING) return

    // Track page load performance
    const trackPerformance = () => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]

        if (navigationEntries.length > 0) {
          const nav = navigationEntries[0]
          const metrics = {
            loadTime: nav.loadEventEnd - nav.loadEventStart,
            domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
            firstPaint: 0,
            firstContentfulPaint: 0,
            url: window.location.href,
            timestamp: new Date().toISOString(),
          }

          // Get paint metrics
          const paintEntries = performance.getEntriesByType('paint')
          paintEntries.forEach(entry => {
            if (entry.name === 'first-paint') {
              metrics.firstPaint = entry.startTime
            }
            if (entry.name === 'first-contentful-paint') {
              metrics.firstContentfulPaint = entry.startTime
            }
          })

          // Send metrics
          sendMetricsToService(metrics)
        }
      }
    }

    // Track after page load
    if (document.readyState === 'complete') {
      setTimeout(trackPerformance, 0)
    } else {
      window.addEventListener('load', () => setTimeout(trackPerformance, 0))
    }
  }, [])

  return null
}

async function sendMetricsToService(metrics: any) {
  try {
    await fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metrics),
    })
  } catch (err) {
    console.error('Failed to send metrics:', err)
  }
}

// Component to track user interactions
export function InteractionTracker({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!env.NEXT_PUBLIC_ENABLE_ANALYTICS) return

    const trackInteraction = (event: Event) => {
      const target = event.target as HTMLElement
      const interactionData = {
        type: event.type,
        target: target.tagName,
        id: target.id,
        className: target.className,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      }

      // Send interaction data
      sendInteractionToService(interactionData)
    }

    // Track clicks
    document.addEventListener('click', trackInteraction)

    return () => {
      document.removeEventListener('click', trackInteraction)
    }
  }, [])

  return <>{children}</>
}

async function sendInteractionToService(data: any) {
  try {
    await fetch('/api/analytics/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch (err) {
    // Fail silently for analytics
  }
}