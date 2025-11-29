/**
 * Performance monitoring utilities
 */

/**
 * Measure execution time of a function
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T> | T
): Promise<T> {
  const start = performance.now()
  try {
    const result = await fn()
    const duration = performance.now() - start
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
    }
    
    // Send to analytics in production
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
    }
    
    return result
  } catch (error) {
    const duration = performance.now() - start
    console.error(`[Performance Error] ${name}: ${duration.toFixed(2)}ms`, error)
    throw error
  }
}

/**
 * Mark performance milestones
 */
export function markPerformance(name: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(name)
  }
}

/**
 * Measure time between two marks
 */
export function measureBetweenMarks(
  name: string,
  startMark: string,
  endMark: string
) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    try {
      performance.measure(name, startMark, endMark)
      const measure = performance.getEntriesByName(name)[0]
      return measure?.duration
    } catch (error) {
      console.error('Performance measurement error:', error)
      return null
    }
  }
  return null
}

/**
 * Get all performance entries
 */
export function getPerformanceEntries() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    return {
      navigation: performance.getEntriesByType('navigation'),
      resource: performance.getEntriesByType('resource'),
      measure: performance.getEntriesByType('measure'),
      mark: performance.getEntriesByType('mark'),
    }
  }
  return null
}

/**
 * Clear performance entries
 */
export function clearPerformanceEntries() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.clearMarks()
    performance.clearMeasures()
  }
}

/**
 * Report Web Vitals
 */
export function reportWebVitals(metric: {
  id: string
  name: string
  value: number
  label: 'web-vital' | 'custom'
}) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric)
  }
  
  // Send to analytics service in production
  if (process.env.NODE_ENV === 'production') {
    // Example: send to analytics
    // analytics.track('web-vital', metric)
  }
}

/**
 * Monitor component render performance
 */
export function useRenderPerformance(componentName: string) {
  if (process.env.NODE_ENV === 'development') {
    const renderCount = React.useRef(0)
    const startTime = React.useRef(performance.now())
    
    React.useEffect(() => {
      renderCount.current++
      const duration = performance.now() - startTime.current
      console.log(
        `[Render] ${componentName} - Render #${renderCount.current}: ${duration.toFixed(2)}ms`
      )
      startTime.current = performance.now()
    })
  }
}

/**
 * Detect slow renders
 */
export function detectSlowRender(threshold: number = 16) {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > threshold) {
          console.warn(
            `[Slow Render] ${entry.name}: ${entry.duration.toFixed(2)}ms`
          )
        }
      }
    })
    
    observer.observe({ entryTypes: ['measure'] })
    
    return () => observer.disconnect()
  }
}

/**
 * Monitor long tasks (> 50ms)
 */
export function monitorLongTasks() {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.warn(
            `[Long Task] Duration: ${entry.duration.toFixed(2)}ms`,
            entry
          )
        }
      })
      
      observer.observe({ entryTypes: ['longtask'] })
      
      return () => observer.disconnect()
    } catch (error) {
      // longtask may not be supported
      console.warn('Long task monitoring not supported')
    }
  }
}

// React import for useRenderPerformance
import * as React from 'react'
