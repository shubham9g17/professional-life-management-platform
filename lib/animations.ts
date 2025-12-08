/**
 * Animation utilities for the Professional Life Management Platform
 * 
 * Provides consistent, professional animations throughout the application
 * with respect for reduced motion preferences.
 */

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Animation variants for common use cases
 */
export const animations = {
  // Fade animations
  fadeIn: 'animate-fade-in',
  
  // Slide animations
  slideIn: 'animate-slide-in',
  slideUp: 'animate-slide-up',
  
  // Scale animations
  scaleIn: 'animate-scale-in',
  
  // Transition durations
  fast: 'transition-all duration-150',
  base: 'transition-all duration-200',
  slow: 'transition-all duration-300',
  
  // Hover effects
  hoverScale: 'hover:scale-105 transition-transform duration-200',
  hoverLift: 'hover:-translate-y-1 hover:shadow-lg transition-all duration-200',
  hoverBrightness: 'hover:brightness-110 transition-all duration-200',
  
  // Focus effects
  focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
} as const

/**
 * Get animation class with reduced motion support
 */
export function getAnimation(animation: keyof typeof animations): string {
  if (prefersReducedMotion()) {
    return ''
  }
  return animations[animation]
}

/**
 * Stagger animation delays for lists
 */
export function getStaggerDelay(index: number, baseDelay = 50): string {
  if (prefersReducedMotion()) return ''
  return `animation-delay: ${index * baseDelay}ms`
}

/**
 * Page transition variants
 */
export const pageTransitions = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2 },
}

/**
 * Modal transition variants
 */
export const modalTransitions = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  content: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
}

/**
 * Toast transition variants
 */
export const toastTransitions = {
  initial: { opacity: 0, y: 50, scale: 0.3 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
}
