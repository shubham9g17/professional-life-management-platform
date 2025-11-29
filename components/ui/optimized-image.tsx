import Image, { ImageProps } from 'next/image'
import { useState } from 'react'
import { Skeleton } from './skeleton'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad'> {
  fallback?: React.ReactNode
  showSkeleton?: boolean
}

/**
 * Optimized image component with lazy loading and skeleton
 */
export function OptimizedImage({
  fallback,
  showSkeleton = true,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (hasError && fallback) {
    return <>{fallback}</>
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && showSkeleton && (
        <Skeleton className="absolute inset-0 z-10" />
      )}
      <Image
        {...props}
        className={className}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
      />
    </div>
  )
}
