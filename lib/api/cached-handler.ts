import { NextRequest, NextResponse } from 'next/server'
import { cache } from '@/lib/redis'
import { cacheTTL } from '@/lib/cache/repository-cache'

interface CachedHandlerOptions {
  /**
   * Cache key generator function
   */
  getCacheKey: (req: NextRequest) => string
  
  /**
   * TTL in seconds
   */
  ttl?: number
  
  /**
   * Whether to cache the response
   */
  shouldCache?: (req: NextRequest, response: any) => boolean
  
  /**
   * Whether to bypass cache
   */
  bypassCache?: (req: NextRequest) => boolean
}

/**
 * Wrapper for API route handlers with Redis caching
 * Implements stale-while-revalidate pattern
 */
export function withCache<T>(
  handler: (req: NextRequest) => Promise<NextResponse<T>>,
  options: CachedHandlerOptions
) {
  return async (req: NextRequest): Promise<NextResponse<T>> => {
    const {
      getCacheKey,
      ttl = cacheTTL.medium,
      shouldCache = () => true,
      bypassCache = () => false,
    } = options

    // Check if we should bypass cache (e.g., for mutations)
    if (bypassCache(req)) {
      return handler(req)
    }

    const cacheKey = getCacheKey(req)

    try {
      // Try to get from cache
      const cached = await cache.get<any>(cacheKey)
      
      if (cached) {
        // Return cached response with stale-while-revalidate header
        const response = NextResponse.json(cached, {
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': `public, max-age=${ttl}, stale-while-revalidate=${ttl * 2}`,
          },
        })
        
        // Revalidate in background (fire and forget)
        revalidateInBackground(req, handler, cacheKey, ttl, shouldCache)
        
        return response
      }

      // Cache miss - execute handler
      const response = await handler(req)
      const data = await response.json()

      // Cache the response if conditions are met
      if (shouldCache(req, data)) {
        await cache.set(cacheKey, data, ttl)
      }

      return NextResponse.json(data, {
        headers: {
          'X-Cache': 'MISS',
          'Cache-Control': `public, max-age=${ttl}, stale-while-revalidate=${ttl * 2}`,
        },
      })
    } catch (error) {
      console.error('Cache error:', error)
      // Fallback to handler without caching
      return handler(req)
    }
  }
}

/**
 * Revalidate cache in background
 */
async function revalidateInBackground<T>(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse<T>>,
  cacheKey: string,
  ttl: number,
  shouldCache: (req: NextRequest, response: any) => boolean
) {
  try {
    const response = await handler(req)
    const data = await response.json()
    
    if (shouldCache(req, data)) {
      await cache.set(cacheKey, data, ttl)
    }
  } catch (error) {
    console.error('Background revalidation error:', error)
  }
}

/**
 * Helper to generate cache keys from request parameters
 */
export function generateCacheKey(
  prefix: string,
  params: Record<string, any>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join(':')
  
  return `${prefix}:${sortedParams}`
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCache(pattern: string) {
  await cache.delPattern(pattern)
}

/**
 * Invalidate specific cache key
 */
export async function invalidateCacheKey(key: string) {
  await cache.del(key)
}
