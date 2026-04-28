'use client'

import * as React from 'react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

type Span =
  | '1x1'
  | '2x1'
  | '1x2'
  | '2x2'
  | '3x1'
  | '4x1'

const spanClasses: Record<Span, string> = {
  '1x1': 'col-span-1 row-span-1',
  '2x1': 'col-span-1 sm:col-span-2 row-span-1',
  '1x2': 'col-span-1 row-span-2',
  '2x2': 'col-span-1 sm:col-span-2 row-span-2',
  '3x1': 'col-span-1 sm:col-span-2 lg:col-span-3 row-span-1',
  '4x1': 'col-span-1 sm:col-span-2 lg:col-span-4 row-span-1',
}

export interface BentoCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  span?: Span
  interactive?: boolean
  index?: number
  as?: 'div' | 'article' | 'section'
  children?: React.ReactNode
}

/**
 * BentoCard — modular surface for the dashboard grid.
 *
 * - Hover scale 1.02 (skipped when prefers-reduced-motion)
 * - Staggered entrance using `index` (50ms per item)
 */
export const BentoCard = React.forwardRef<HTMLDivElement, BentoCardProps>(
  ({ className, span = '1x1', interactive = false, index = 0, children, ...props }, ref) => {
    const reduce = useReducedMotion()

    return (
      <motion.div
        ref={ref}
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{
          duration: 0.35,
          delay: reduce ? 0 : Math.min(index, 10) * 0.04,
          ease: [0.16, 1, 0.3, 1],
        }}
        whileHover={
          interactive && !reduce ? { scale: 1.015, transition: { duration: 0.15 } } : undefined
        }
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-[var(--card-radius)] border border-border bg-card text-card-foreground shadow-sm',
          'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-br before:from-foreground/[0.03] before:to-transparent',
          interactive && 'cursor-pointer transition-shadow duration-200 hover:shadow-md',
          spanClasses[span],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
BentoCard.displayName = 'BentoCard'

export function BentoCardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('relative z-[1] flex items-start justify-between gap-3 p-5 pb-3', className)} {...props} />
}

export function BentoCardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-sm font-medium tracking-tight text-muted-foreground', className)}
      {...props}
    />
  )
}

export function BentoCardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('relative z-[1] flex-1 px-5 pb-5', className)} {...props} />
}

export function BentoCardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('relative z-[1] mt-auto flex items-center justify-between gap-2 border-t border-border/60 px-5 py-3 text-xs text-muted-foreground', className)}
      {...props}
    />
  )
}

/**
 * BentoGrid — the canonical 4-column auto-row grid used by the dashboard.
 */
export function BentoGrid({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-[var(--bento-gap)] sm:grid-cols-2 lg:grid-cols-4',
        'auto-rows-[minmax(180px,auto)]',
        className
      )}
      {...props}
    />
  )
}
