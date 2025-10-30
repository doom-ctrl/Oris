import { useState, useEffect } from 'react'

interface UseMobileReturn {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isSmallScreen: boolean
  isMediumScreen: boolean
  isLargeScreen: boolean
  screenWidth: number
  screenHeight: number
  orientation: 'portrait' | 'landscape'
}

export function useMobile(): UseMobileReturn {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  })

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowSize.width > 0 && windowSize.width < 640
  const isTablet = windowSize.width >= 640 && windowSize.width < 1024
  const isDesktop = windowSize.width >= 1024
  const isSmallScreen = windowSize.width > 0 && windowSize.width < 640
  const isMediumScreen = windowSize.width >= 640 && windowSize.width < 1024
  const isLargeScreen = windowSize.width >= 1024
  const orientation = windowSize.height > windowSize.width ? 'portrait' : 'landscape'

  return {
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    screenWidth: windowSize.width,
    screenHeight: windowSize.height,
    orientation,
  }
}

interface UseTouchReturn {
  isTouchDevice: boolean
  hasHover: boolean
}

export function useTouch(): UseTouchReturn {
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [hasHover, setHasHover] = useState(true)

  useEffect(() => {
    const checkTouchDevice = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      setIsTouchDevice(hasTouch)
      setHasHover(!hasTouch && window.matchMedia('(hover: hover)').matches)
    }

    checkTouchDevice()

    // Listen for changes in hover capability
    const mediaQuery = window.matchMedia('(hover: hover)')
    const handleMediaChange = () => setHasHover(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleMediaChange)

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange)
    }
  }, [])

  return {
    isTouchDevice,
    hasHover,
  }
}

interface UseNetworkReturn {
  isOnline: boolean
  connectionType: string
  effectiveType: string
}

export function useNetwork(): UseNetworkReturn {
  const [networkState, setNetworkState] = useState({
    isOnline: true,
    connectionType: 'unknown',
    effectiveType: 'unknown',
  })

  useEffect(() => {
    const updateNetworkState = () => {
      const connection = (navigator as any).connection ||
                        (navigator as any).mozConnection ||
                        (navigator as any).webkitConnection

      setNetworkState({
        isOnline: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
      })
    }

    updateNetworkState()

    const handleOnline = () => updateNetworkState()
    const handleOffline = () => updateNetworkState()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return networkState
}

export function useResponsiveValue<T>(
  mobile: T,
  tablet?: T,
  desktop?: T
): T {
  const { isMobile, isTablet, isDesktop } = useMobile()

  if (isDesktop && desktop !== undefined) return desktop
  if (isTablet && tablet !== undefined) return tablet
  if (isMobile) return mobile

  return mobile
}

export function useBreakpoint() {
  const { screenWidth } = useMobile()

  const breakpoints = {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  }

  const currentBreakpoint = Object.entries(breakpoints)
    .reverse()
    .find(([_, width]) => screenWidth >= width)?.[0] || 'xs'

  return {
    current: currentBreakpoint as keyof typeof breakpoints,
    is: (breakpoint: keyof typeof breakpoints) => screenWidth >= breakpoints[breakpoint],
    above: (breakpoint: keyof typeof breakpoints) => screenWidth > breakpoints[breakpoint],
    below: (breakpoint: keyof typeof breakpoints) => screenWidth < breakpoints[breakpoint],
    between: (min: keyof typeof breakpoints, max: keyof typeof breakpoints) =>
      screenWidth >= breakpoints[min] && screenWidth < breakpoints[max],
  }
}