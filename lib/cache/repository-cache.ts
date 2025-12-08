import { cache } from '@/lib/redis'

/**
 * Cache key generators for different entities
 */
export const cacheKeys = {
  task: {
    byUser: (userId: string) => `task:user:${userId}`,
    byId: (id: string) => `task:id:${id}`,
    stats: (userId: string) => `task:stats:${userId}`,
    overdue: (userId: string) => `task:overdue:${userId}`,
    dueSoon: (userId: string) => `task:dueSoon:${userId}`,
  },
  habit: {
    byUser: (userId: string) => `habit:user:${userId}`,
    byId: (id: string) => `habit:id:${id}`,
    stats: (userId: string) => `habit:stats:${userId}`,
  },
  transaction: {
    byUser: (userId: string) => `transaction:user:${userId}`,
    byId: (id: string) => `transaction:id:${id}`,
    stats: (userId: string) => `transaction:stats:${userId}`,
  },
  exercise: {
    byUser: (userId: string) => `exercise:user:${userId}`,
    byId: (id: string) => `exercise:id:${id}`,
    stats: (userId: string) => `exercise:stats:${userId}`,
  },
  meal: {
    byUser: (userId: string) => `meal:user:${userId}`,
    byId: (id: string) => `meal:id:${id}`,
    stats: (userId: string) => `meal:stats:${userId}`,
  },
  learning: {
    byUser: (userId: string) => `learning:user:${userId}`,
    byId: (id: string) => `learning:id:${id}`,
    stats: (userId: string) => `learning:stats:${userId}`,
  },
  analytics: {
    overview: (userId: string) => `analytics:overview:${userId}`,
    trends: (userId: string, period: string) => `analytics:trends:${userId}:${period}`,
    insights: (userId: string) => `analytics:insights:${userId}`,
  },
  notification: {
    byUser: (userId: string) => `notification:user:${userId}`,
    unread: (userId: string) => `notification:unread:${userId}`,
  },
}

/**
 * Cache TTL (Time To Live) in seconds
 */
export const cacheTTL = {
  short: 60, // 1 minute - for frequently changing data
  medium: 300, // 5 minutes - for moderately changing data
  long: 900, // 15 minutes - for rarely changing data
  veryLong: 3600, // 1 hour - for very stable data
}

/**
 * Invalidate cache for a specific user and entity type
 */
export async function invalidateUserCache(userId: string, entityType: string) {
  const patterns = [
    `${entityType}:user:${userId}*`,
    `${entityType}:stats:${userId}*`,
    `analytics:*:${userId}*`,
  ]

  await Promise.all(patterns.map(pattern => cache.delPattern(pattern)))
}

/**
 * Invalidate all cache for a user
 */
export async function invalidateAllUserCache(userId: string) {
  await cache.delPattern(`*:${userId}*`)
}

/**
 * Wrapper function to add caching to repository methods
 */
export function withCache<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttl: number = cacheTTL.medium
): Promise<T> {
  return cache.getOrSet(cacheKey, fetcher, ttl)
}
