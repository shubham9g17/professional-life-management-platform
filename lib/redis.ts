import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

// Check if Redis is enabled via environment variable
const REDIS_ENABLED = process.env.ENABLE_REDIS !== 'false'

// Redis client configuration with connection pooling
let redis: Redis | null = null

if (REDIS_ENABLED && process.env.REDIS_URL) {
  redis =
    globalForRedis.redis ??
    new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      lazyConnect: true,
      // Connection pool settings
      connectionName: 'professional-life-platform',
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
    })

  if (process.env.NODE_ENV !== 'production') {
    globalForRedis.redis = redis
  }

  // Connect to Redis
  redis.connect().catch((err) => {
    console.warn('Redis connection failed:', err.message)
    console.warn('Continuing without Redis cache')
    redis = null
  })

  // Graceful shutdown
  if (process.env.NODE_ENV === 'production') {
    process.on('beforeExit', async () => {
      if (redis) {
        await redis.quit()
      }
    })
  }
} else {
  console.info('Redis caching is disabled. Running without cache.')
}

// Export redis instance (may be null if disabled)
export { redis }

// Cache helper functions with Redis opt-out support
export const cache = {
  /**
   * Get a value from cache
   * Returns null if Redis is disabled or on error
   */
  async get<T>(key: string): Promise<T | null> {
    if (!redis) {
      return null
    }
    
    try {
      const value = await redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  },

  /**
   * Set a value in cache with optional TTL (in seconds)
   * No-op if Redis is disabled
   */
  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    if (!redis) {
      return
    }
    
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  },

  /**
   * Delete a value from cache
   * No-op if Redis is disabled
   */
  async del(key: string): Promise<void> {
    if (!redis) {
      return
    }
    
    try {
      await redis.del(key)
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  },

  /**
   * Delete multiple keys matching a pattern
   * No-op if Redis is disabled
   */
  async delPattern(pattern: string): Promise<void> {
    if (!redis) {
      return
    }
    
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error)
    }
  },

  /**
   * Check if a key exists
   * Returns false if Redis is disabled
   */
  async exists(key: string): Promise<boolean> {
    if (!redis) {
      return false
    }
    
    try {
      const result = await redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  },

  /**
   * Get or set pattern - fetch from cache or compute and cache
   * Always fetches if Redis is disabled
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    if (!redis) {
      // No cache available, always fetch
      return await fetcher()
    }
    
    const cached = await this.get(key) as T | null
    if (cached !== null) {
      return cached
    }

    const value = await fetcher()
    await this.set(key, value, ttl)
    return value
  },
  
  /**
   * Check if Redis caching is enabled
   */
  isEnabled(): boolean {
    return redis !== null
  },
}

export default redis
