# Caching Strategy

This document outlines the comprehensive caching strategy implemented in the Professional Life Management Platform.

## Overview

The platform implements a multi-layer caching strategy to achieve sub-200ms response times:

1. **Server-side Redis Cache** - For API responses and database queries
2. **Client-side React Query Cache** - For UI data with stale-while-revalidate
3. **Database Query Optimization** - Composite indexes and connection pooling
4. **Code Splitting & Lazy Loading** - Optimized bundle sizes

## Server-Side Caching (Redis)

### Configuration

Redis is configured with connection pooling and automatic retry logic:

```typescript
// lib/redis.ts
const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  connectionName: 'professional-life-platform',
})
```

### Cache TTL Strategy

Different data types have different Time-To-Live (TTL) values:

- **Short (60s)**: Frequently changing data (notifications, real-time stats)
- **Medium (300s)**: Moderately changing data (task lists, habit data)
- **Long (900s)**: Rarely changing data (user preferences, budgets)
- **Very Long (3600s)**: Very stable data (achievements, historical reports)

### Cache Keys

Consistent cache key patterns are used across the application:

```typescript
// Examples
task:user:{userId}
task:stats:{userId}
analytics:overview:{userId}
notification:unread:{userId}
```

### Cache Invalidation

Cache is automatically invalidated when data changes:

```typescript
// After creating/updating a task
await invalidateUserCache(userId, 'task')
await invalidateUserCache(userId, 'analytics')
```

## Client-Side Caching (React Query)

### Configuration

React Query is configured with stale-while-revalidate pattern:

```typescript
{
  staleTime: 5 * 60 * 1000,      // 5 minutes - data is fresh
  gcTime: 10 * 60 * 1000,        // 10 minutes - garbage collection
  refetchOnWindowFocus: true,     // Refetch when window gains focus
  refetchOnReconnect: true,       // Refetch when reconnecting
}
```

### Query Keys

Hierarchical query keys for efficient invalidation:

```typescript
// Task queries
['tasks']                          // All tasks
['tasks', 'list']                  // All task lists
['tasks', 'list', { filters }]     // Specific filtered list
['tasks', 'detail', id]            // Single task detail
['tasks', 'stats', userId]         // Task statistics
```

### Optimistic Updates

Mutations use optimistic updates for instant UI feedback:

```typescript
const mutation = useMutation({
  mutationFn: updateTask,
  onMutate: async (newTask) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['tasks'] })
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['tasks'])
    
    // Optimistically update
    queryClient.setQueryData(['tasks'], (old) => [...old, newTask])
    
    return { previous }
  },
  onError: (err, newTask, context) => {
    // Rollback on error
    queryClient.setQueryData(['tasks'], context.previous)
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  },
})
```

## Database Optimization

### Composite Indexes

Composite indexes are added for common query patterns:

```prisma
// Task model
@@index([userId, status, dueDate])
@@index([userId, workspace, status])
@@index([userId, dueDate])

// Transaction model
@@index([userId, type, date])
@@index([userId, category, date])
```

### Connection Pooling

Prisma client is configured with connection pooling:

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})
```

### N+1 Query Prevention

Queries use `include` and `select` to prevent N+1 queries:

```typescript
// Good - Single query with join
const tasks = await prisma.task.findMany({
  where: { userId },
  include: { user: true },
})

// Bad - N+1 queries
const tasks = await prisma.task.findMany({ where: { userId } })
for (const task of tasks) {
  const user = await prisma.user.findUnique({ where: { id: task.userId } })
}
```

## API Route Caching

API routes use the `withCache` wrapper for automatic caching:

```typescript
export const GET = withCache(
  async (req: NextRequest) => {
    const userId = getUserIdFromSession(req)
    const tasks = await taskRepository.findByUserId(userId)
    return NextResponse.json(tasks)
  },
  {
    getCacheKey: (req) => `task:user:${getUserIdFromSession(req)}`,
    ttl: cacheTTL.medium,
    shouldCache: (req, data) => data.length > 0,
  }
)
```

## Client-Side Performance

### Code Splitting

Next.js automatically code splits by route. Additional splitting for large components:

```typescript
// Lazy load heavy components
const HeavyChart = lazyLoad(() => import('./heavy-chart'))
```

### Virtual Scrolling

Long lists use virtual scrolling to render only visible items:

```typescript
<VirtualList
  items={tasks}
  itemHeight={80}
  containerHeight={600}
  renderItem={(task) => <TaskCard task={task} />}
/>
```

### Memoization

Expensive calculations are memoized:

```typescript
const expensiveValue = useMemo(() => {
  return calculateComplexMetrics(data)
}, [data])
```

## Performance Monitoring

### Web Vitals

Core Web Vitals are tracked:

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Custom Metrics

Custom performance metrics are tracked:

```typescript
measurePerformance('task-list-render', async () => {
  return await fetchTasks()
})
```

## Cache Warming

Critical data is pre-fetched on page load:

```typescript
// In dashboard page
export async function generateMetadata() {
  // Pre-fetch critical data
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.analytics.overview(userId),
      queryFn: () => fetchAnalytics(userId),
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.tasks.list({ status: 'TODO' }),
      queryFn: () => fetchTasks({ status: 'TODO' }),
    }),
  ])
}
```

## Best Practices

1. **Always use query keys from `queryKeys` factory** - Ensures consistency
2. **Invalidate related caches** - When updating tasks, invalidate analytics too
3. **Use optimistic updates** - For instant UI feedback
4. **Monitor cache hit rates** - Check `X-Cache` headers in development
5. **Set appropriate TTLs** - Balance freshness vs performance
6. **Use stale-while-revalidate** - Serve stale data while revalidating
7. **Implement cache warming** - Pre-fetch critical data
8. **Monitor performance** - Track Web Vitals and custom metrics

## Environment Variables

```bash
# Redis configuration
REDIS_URL="redis://localhost:6379"

# Optional: Redis password
REDIS_PASSWORD="your-password"

# Optional: Redis database number
REDIS_DB="0"
```

## Troubleshooting

### Cache Not Working

1. Check Redis connection: `redis-cli ping`
2. Check environment variables
3. Check cache keys in logs
4. Verify TTL values

### Stale Data

1. Check cache invalidation logic
2. Verify mutation callbacks
3. Check TTL values
4. Force refetch: `queryClient.invalidateQueries()`

### Performance Issues

1. Check cache hit rates
2. Monitor slow queries
3. Check bundle sizes
4. Profile component renders
5. Check network waterfall

## Future Improvements

1. **CDN Caching** - Cache static assets on CDN
2. **Service Worker** - Offline caching with service worker
3. **Incremental Static Regeneration** - For public pages
4. **Edge Caching** - Cache at edge locations
5. **GraphQL with DataLoader** - Batch and cache GraphQL queries
