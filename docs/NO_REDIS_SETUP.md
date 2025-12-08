# Running Without Redis

This guide explains how to run the Professional Life Management Platform without any external caching dependency.

## Overview

The platform is designed to work **completely standalone** without requiring Redis or any other external caching service. Redis is purely optional and used only for performance optimization.

## Configuration

### Disable Redis

Set the following environment variable:

```env
ENABLE_REDIS="false"
```

That's it! The application will run without attempting to connect to Redis.

### Environment Files

#### Development (.env)
```env
# Database (SQLite for development)
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-in-production"

# Redis - DISABLED
ENABLE_REDIS="false"

# Security
ENCRYPTION_KEY="change-this-to-a-secure-random-key-in-production"
```

#### Production (.env.production)
```env
# Database (PostgreSQL for production)
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public&sslmode=require"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="<generated-secret>"

# Redis - DISABLED (no external dependency)
ENABLE_REDIS="false"

# Security
ENCRYPTION_KEY="<generated-key>"
```

## What Happens Without Redis?

### Application Behavior

When Redis is disabled:

1. **Startup**: Application starts normally without attempting Redis connection
2. **Health Check**: Shows Redis as "disabled" (not "degraded" or "unhealthy")
3. **Cache Operations**: All cache operations become no-ops (silently ignored)
4. **Performance**: Queries run directly against the database every time

### Health Check Response

```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "healthy" },
    "redis": { 
      "status": "disabled",
      "message": "Redis caching is disabled"
    },
    "memory": { "status": "healthy" }
  }
}
```

### Performance Impact

| Operation | With Redis | Without Redis |
|-----------|------------|---------------|
| First request | ~200ms | ~200ms |
| Cached request | ~10ms | ~200ms |
| Database load | Low | Normal |
| Scalability | High | Moderate |

**Bottom line**: The app works perfectly without Redis, just without caching benefits.

## When to Use Redis

### Skip Redis If:
- ✅ Running locally for development
- ✅ Small user base (< 100 users)
- ✅ Want zero external dependencies
- ✅ Deploying to simple hosting (no Redis available)
- ✅ Cost-sensitive deployment

### Use Redis If:
- ✅ Production deployment with many users
- ✅ Need optimal performance
- ✅ High traffic expected
- ✅ Want to reduce database load
- ✅ Deploying to platform with Redis support (Vercel, AWS, etc.)

## Deployment Examples

### Vercel (No Redis)

```bash
# Set environment variable
vercel env add ENABLE_REDIS production
# Enter: false

# Deploy
vercel --prod
```

### Docker (No Redis)

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://...
      - NEXTAUTH_URL=https://your-domain.com
      - NEXTAUTH_SECRET=...
      - ENABLE_REDIS=false  # No Redis needed!
      - ENCRYPTION_KEY=...
    # No Redis service needed!
```

### Traditional Hosting (No Redis)

```bash
# .env.production
ENABLE_REDIS="false"

# Build and run
npm run build
npm start
```

## Enabling Redis Later

If you want to add Redis later for performance:

1. **Set up Redis** (Upstash, Redis Cloud, etc.)

2. **Update environment**:
   ```env
   ENABLE_REDIS="true"
   REDIS_URL="redis://your-redis-url:6379"
   ```

3. **Redeploy**:
   ```bash
   vercel --prod
   ```

That's it! No code changes needed.

## Code Examples

### Cache Operations (Work With or Without Redis)

```typescript
import { cache } from '@/lib/redis'

// Get from cache (returns null if Redis disabled)
const data = await cache.get('key')

// Set in cache (no-op if Redis disabled)
await cache.set('key', value, 300)

// Get or fetch pattern (always works)
const result = await cache.getOrSet(
  'key',
  async () => {
    // This fetcher runs if cache miss OR Redis disabled
    return await fetchData()
  },
  300
)

// Check if Redis is enabled
if (cache.isEnabled()) {
  console.log('Using Redis cache')
} else {
  console.log('Running without cache')
}
```

### Repository Pattern (Automatic Fallback)

```typescript
// This works with or without Redis
export async function getTasks(userId: string) {
  return await cache.getOrSet(
    `tasks:${userId}`,
    async () => {
      // Fetches from database
      return await prisma.task.findMany({
        where: { userId }
      })
    },
    300 // 5 minutes TTL
  )
}
```

## Monitoring

### Check Redis Status

```bash
# Health check
curl https://your-domain.com/health | jq '.checks.redis'

# With Redis enabled
{
  "status": "healthy",
  "responseTime": 5
}

# With Redis disabled
{
  "status": "disabled",
  "message": "Redis caching is disabled"
}
```

### Logs

When Redis is disabled, you'll see:
```
Redis caching is disabled. Running without cache.
```

When Redis is enabled but fails:
```
Redis connection failed: [error message]
Continuing without Redis cache
```

## Troubleshooting

### Issue: "Redis connection failed"

**Solution**: Disable Redis if you don't need it:
```env
ENABLE_REDIS="false"
```

### Issue: Slow performance without Redis

**Options**:
1. Enable Redis for caching
2. Optimize database queries
3. Add database indexes
4. Use database query caching

### Issue: Want to test with/without Redis

```bash
# Test without Redis
ENABLE_REDIS=false npm run dev

# Test with Redis
ENABLE_REDIS=true REDIS_URL=redis://localhost:6379 npm run dev
```

## Best Practices

1. **Development**: Run without Redis for simplicity
   ```env
   ENABLE_REDIS="false"
   ```

2. **Staging**: Test with Redis if using in production
   ```env
   ENABLE_REDIS="true"
   REDIS_URL="redis://staging-redis:6379"
   ```

3. **Production**: Use Redis for optimal performance
   ```env
   ENABLE_REDIS="true"
   REDIS_URL="redis://production-redis:6379"
   ```

4. **Small Deployments**: Skip Redis to reduce complexity
   ```env
   ENABLE_REDIS="false"
   ```

## Summary

✅ **Zero external dependencies**: Set `ENABLE_REDIS=false`
✅ **Works perfectly**: All features functional without Redis
✅ **Easy deployment**: No Redis setup required
✅ **Add later**: Enable Redis anytime for performance boost
✅ **No code changes**: Same codebase works with or without Redis

The platform is designed to be **deployment-friendly** and work in any environment, with or without external caching services.
