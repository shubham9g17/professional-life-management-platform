import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function Container({ 
  className, 
  size = 'xl',
  ...props 
}: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        {
          'max-w-3xl': size === 'sm',
          'max-w-5xl': size === 'md',
          'max-w-7xl': size === 'lg',
          'max-w-[1400px]': size === 'xl',
          'max-w-full': size === 'full',
        },
        className
      )}
      {...props}
    />
  )
}

export interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
}

export function ResponsiveGrid({ 
  className,
  cols = { default: 1, sm: 2, lg: 3 },
  gap = 6,
  ...props 
}: ResponsiveGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  }

  const gapClass = `gap-${gap}`

  return (
    <div
      className={cn(
        'grid',
        gapClass,
        cols.default && gridCols[cols.default as keyof typeof gridCols],
        cols.sm && `sm:${gridCols[cols.sm as keyof typeof gridCols]}`,
        cols.md && `md:${gridCols[cols.md as keyof typeof gridCols]}`,
        cols.lg && `lg:${gridCols[cols.lg as keyof typeof gridCols]}`,
        cols.xl && `xl:${gridCols[cols.xl as keyof typeof gridCols]}`,
        className
      )}
      {...props}
    />
  )
}

export function Stack({ 
  className,
  spacing = 4,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { spacing?: number }) {
  return (
    <div
      className={cn(`flex flex-col gap-${spacing}`, className)}
      {...props}
    />
  )
}

export function Inline({ 
  className,
  spacing = 4,
  ...props 
}: React.HTMLAttributes<HTMLDivElement> & { spacing?: number }) {
  return (
    <div
      className={cn(`flex flex-row items-center gap-${spacing}`, className)}
      {...props}
    />
  )
}
