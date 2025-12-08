'use client'

import { useEffect } from 'react'
import { useReportWebVitals } from 'next/web-vitals'

/**
 * Web Vitals reporter component
 * Tracks Core Web Vitals: LCP, FID, CLS, FCP, TTFB
 */
export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals]', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        id: metric.id,
      })
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to your analytics service
      // analytics.track('web-vital', {
      //   metric: metric.name,
      //   value: metric.value,
      //   rating: metric.rating,
      //   id: metric.id,
      // })
    }

    // Alert on poor performance
    if (metric.rating === 'poor') {
      console.warn(`Poor ${metric.name} performance:`, metric.value)
    }
  })

  return null
}
