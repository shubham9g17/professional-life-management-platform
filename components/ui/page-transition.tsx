'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { prefersReducedMotion } from '@/lib/animations'

export interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    // Trigger animation after mount
    setIsVisible(true)
  }, [])

  const shouldAnimate = !prefersReducedMotion()

  return (
    <div
      className={cn(
        'w-full',
        shouldAnimate && 'transition-all duration-200',
        shouldAnimate && (isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'),
        !shouldAnimate && 'opacity-100',
        className
      )}
    >
      {children}
    </div>
  )
}

export function FadeIn({ 
  children, 
  delay = 0,
  className 
}: { 
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const shouldAnimate = !prefersReducedMotion()

  return (
    <div
      className={cn(
        shouldAnimate && 'transition-opacity duration-300',
        shouldAnimate && (isVisible ? 'opacity-100' : 'opacity-0'),
        !shouldAnimate && 'opacity-100',
        className
      )}
    >
      {children}
    </div>
  )
}

export function SlideIn({ 
  children, 
  direction = 'up',
  delay = 0,
  className 
}: { 
  children: React.ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  className?: string
}) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  const shouldAnimate = !prefersReducedMotion()

  const getTransform = () => {
    if (!shouldAnimate) return ''
    if (isVisible) return 'translate-x-0 translate-y-0'
    
    switch (direction) {
      case 'up':
        return 'translate-y-4'
      case 'down':
        return '-translate-y-4'
      case 'left':
        return 'translate-x-4'
      case 'right':
        return '-translate-x-4'
      default:
        return 'translate-y-4'
    }
  }

  return (
    <div
      className={cn(
        shouldAnimate && 'transition-all duration-300',
        shouldAnimate && (isVisible ? 'opacity-100' : 'opacity-0'),
        shouldAnimate && getTransform(),
        !shouldAnimate && 'opacity-100',
        className
      )}
    >
      {children}
    </div>
  )
}
