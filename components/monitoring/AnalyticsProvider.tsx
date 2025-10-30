'use client'

import { useEffect } from 'react'
import { env } from '@/lib/env'

interface AnalyticsProviderProps {
  children: React.ReactNode
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useEffect(() => {
    if (!env.NEXT_PUBLIC_ENABLE_ANALYTICS || typeof window === 'undefined') {
      return
    }

    // Initialize analytics (PostHog example)
    if (env.NEXT_PUBLIC_POSTHOG_KEY) {
      // PostHog initialization
      ;(window as any).posthog = PostHogLib.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: 'https://app.posthog.com',
        loaded: (posthog: any) => {
          posthog.identify(
            // User ID would come from auth context
            'user_id',
            // User properties
            {
              email: 'user@example.com',
              environment: env.NODE_ENV,
            }
          )
        },
      })
    }

    // Vercel Analytics
    if (env.NEXT_PUBLIC_VERCEL_ANALYTICS_ID) {
      // Vercel Analytics is automatically loaded via the package
      // No additional initialization needed
    }

    // Page view tracking
    const trackPageView = () => {
      const pageData = {
        url: window.location.href,
        path: window.location.pathname,
        title: document.title,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }

      // Send to analytics service
      if (env.NEXT_PUBLIC_POSTHOG_KEY && (window as any).posthog) {
        (window as any).posthog.capture('$pageview', pageData)
      }

      // Send to custom analytics endpoint
      sendPageViewData(pageData)
    }

    // Track initial page view
    trackPageView()

    // Track page changes for SPA
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function(...args) {
      originalPushState.apply(history, args)
      setTimeout(trackPageView, 0)
    }

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args)
      setTimeout(trackPageView, 0)
    }

    window.addEventListener('popstate', trackPageView)

    return () => {
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
      window.removeEventListener('popstate', trackPageView)
    }
  }, [])

  return <>{children}</>
}

async function sendPageViewData(data: any) {
  try {
    await fetch('/api/analytics/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  } catch (err) {
    // Fail silently for analytics
  }
}

// Minimal PostHog implementation (would normally import from posthog-js)
const PostHogLib = {
  init: (apiKey: string, options: any) => {
    return {
      identify: (userId: string, properties?: any) => {
        console.log('PostHog identify:', userId, properties)
      },
      capture: (event: string, properties?: any) => {
        console.log('PostHog capture:', event, properties)
      },
    }
  }
}