/**
 * Responsive design utilities for the Professional Life Management Platform
 * 
 * Provides utilities for responsive behavior and mobile optimization
 */

/**
 * Breakpoints matching Tailwind CSS defaults
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type Breakpoint = keyof typeof breakpoints

/**
 * Check if current viewport matches a breakpoint
 */
export function useMediaQuery(query: string): boolean {
  if (typeof window === 'undefined') return false
  
  const [matches, setMatches] = React.useState(() => {
    return window.matchMedia(query).matches
  })

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)
    
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

/**
 * Check if viewport is mobile
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${breakpoints.md - 1}px)`)
}

/**
 * Check if viewport is tablet
 */
export function useIsTablet(): boolean {
  return useMediaQuery(
    `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`
  )
}

/**
 * Check if viewport is desktop
 */
export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.lg}px)`)
}

/**
 * Get current breakpoint
 */
export function useBreakpoint(): Breakpoint | 'xs' {
  const is2xl = useMediaQuery(`(min-width: ${breakpoints['2xl']}px)`)
  const isXl = useMediaQuery(`(min-width: ${breakpoints.xl}px)`)
  const isLg = useMediaQuery(`(min-width: ${breakpoints.lg}px)`)
  const isMd = useMediaQuery(`(min-width: ${breakpoints.md}px)`)
  const isSm = useMediaQuery(`(min-width: ${breakpoints.sm}px)`)

  if (is2xl) return '2xl'
  if (isXl) return 'xl'
  if (isLg) return 'lg'
  if (isMd) return 'md'
  if (isSm) return 'sm'
  return 'xs'
}

/**
 * Touch device detection
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * Viewport dimensions hook
 */
export function useViewport() {
  const [viewport, setViewport] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  React.useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return viewport
}

// Add React import for hooks
import * as React from 'react'
