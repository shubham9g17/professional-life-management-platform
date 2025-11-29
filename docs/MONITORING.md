# Monitoring and Observability Guide

This guide covers setting up comprehensive monitoring and observability for the Professional Life Management Platform.

## Table of Contents

1. [Overview](#overview)
2. [Application Performance Monitoring](#application-performance-monitoring)
3. [Error Tracking](#error-tracking)
4. [Database Monitoring](#database-monitoring)
5. [Uptime Monitoring](#uptime-monitoring)
6. [Log Aggregation](#log-aggregation)
7. [Alerting](#alerting)
8. [Dashboards](#dashboards)
9. [Metrics to Monitor](#metrics-to-monitor)

## Overview

The platform includes built-in monitoring capabilities through:

- Structured logging with correlation IDs
- Performance tracking for database queries
- Error handling with stack traces
- Health check endpoints
- Audit trails for security events

## Application Performance Monitoring

### Sentry Setup (Recommended)

Sentry provides excellent error tracking and performance monitoring for Next.js applications.

#### Installation

```bash
npm install @sentry/nextjs
```

#### Configuration

1. Run the Sentry wizard:
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

2. Update `sentry.client.config.ts`:
   ```typescript
   import * as Sentry from "@sentry/nextjs";

   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     environment: process.env.NODE_ENV,
     
     // Performance Monitoring
     tracesSampleRate: 0.1, // 10% of transactions
     
     // Session Replay
     replaysSessionSampleRate: 0.1,
     replaysOnErrorSampleRate: 1.0,
     
     // Ignore common errors
     ignoreErrors: [
       'ResizeObserver loop limit exceeded',
       'Non-Error promise rejection captured',
     ],
     
     // Filter sensitive data
     beforeSend(event, hint) {
       // Remove sensitive data
       if (event.request) {
         delete event.request.cookies;
         delete event.request.headers;
       }
       return event;
     },
   });
   ```

3. Update `sentry.server.config.ts`:
   ```typescript
   import * as Sentry from "@sentry/nextjs";

   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
     
     tracesSampleRate: 0.1,
     
     // Capture console errors
     integrations: [
       new Sentry.Integrations.Console({
         levels: ['error'],
       }),
     ],
   });
   ```

4. Add environment variables:
   ```env
   SENTRY_DSN="https://...@sentry.io/..."
   NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
   SENTRY_AUTH_TOKEN="..."
   ```

#### Custom Instrumentation

Add custom performance tracking:

```typescript
import * as Sentry from "@sentry/nextjs";

// Track database queries
export async function trackQuery<T>(
  name: string,
  query: () => Promise<T>
): Promise<T> {
  const transaction = Sentry.startTransaction({
    op: "db.query",
    name,
  });

  try {
    const result = await query();
    transaction.setStatus("ok");
    return result;
  } catch (error) {
    transaction.setStatus("internal_error");
    throw error;
  } finally {
    transaction.finish();
  }
}
```

### New Relic Setup

Alternative to Sentry for enterprise environments.

#### Installation

```bash
npm install newrelic
```

#### Configuration

1. Create `newrelic.js` in project root:
   ```javascript
   'use strict'

   exports.config = {
     app_name: ['Professional Life Management Platform'],
     license_key: process.env.NEW_RELIC_LICENSE_KEY,
     logging: {
       level: 'info'
     },
     allow_all_headers: true,
     attributes: {
       exclude: [
         'request.headers.cookie',
         'request.headers.authorization',
         'request.headers.proxyAuthorization',
         'request.headers.setCookie*',
         'request.headers.x*',
         'response.headers.cookie',
         'response.headers.authorization',
         'response.headers.proxyAuthorization',
         'response.headers.setCookie*',
         'response.headers.x*'
       ]
     }
   }
   ```

2. Import at the top of `next.config.ts`:
   ```typescript
   if (process.env.NEW_RELIC_LICENSE_KEY) {
     require('newrelic');
   }
   ```

## Error Tracking

### Built-in Error Logging

The platform includes comprehensive error logging:

```typescript
import { logger } from '@/lib/logging'

try {
  // Your code
} catch (error) {
  logger.error('Operation failed', {
    error,
    userId: user.id,
    operation: 'task_creation',
  })
  throw error
}
```

### Error Boundaries

React error boundaries are already configured:

```typescript
// components/error/error-boundary.tsx
import { ErrorBoundary } from '@/components/error/error-boundary'

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### Global Error Handler

The global error handler is configured in `app/global-error.tsx`.

## Database Monitoring

### PostgreSQL Monitoring

#### pg_stat_statements Extension

Enable query performance tracking:

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slow queries
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- queries taking more than 100ms
ORDER BY mean_exec_time DESC
LIMIT 20;
```

#### Connection Monitoring

```sql
-- Check active connections
SELECT 
  datname,
  count(*) as connections
FROM pg_stat_activity
GROUP BY datname;

-- Check long-running queries
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query,
  state
FROM pg_stat_activity
WHERE state != 'idle'
  AND now() - pg_stat_activity.query_start > interval '5 minutes'
ORDER BY duration DESC;
```

### Prisma Logging

Enable Prisma query logging in development:

```typescript
// lib/prisma.ts
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn']
    : ['error'],
})
```

### Database Alerts

Set up alerts for:
- Connection pool exhaustion
- Slow queries (> 1 second)
- High CPU usage (> 80%)
- High memory usage (> 90%)
- Replication lag (if using replicas)

## Uptime Monitoring

### Health Check Endpoint

The platform includes a health check endpoint at `/health`:

```bash
curl https://your-domain.com/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 86400,
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 15
    },
    "redis": {
      "status": "healthy",
      "responseTime": 5
    },
    "memory": {
      "status": "healthy",
      "usage": 524288000,
      "limit": 1073741824,
      "percentage": 48.83
    }
  }
}
```

### UptimeRobot Setup

1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Create a new monitor:
   - Monitor Type: HTTP(s)
   - URL: `https://your-domain.com/health`
   - Monitoring Interval: 5 minutes
   - Alert Contacts: Your email/SMS

3. Configure keyword monitoring:
   - Keyword: `"status":"healthy"`
   - Alert if keyword is not found

### Pingdom Setup

1. Sign up at [pingdom.com](https://pingdom.com)
2. Create uptime check:
   - Name: Professional Life Platform
   - URL: `https://your-domain.com/health`
   - Check interval: 1 minute
   - Response time threshold: 2000ms

3. Set up transaction monitoring for critical flows:
   - User login
   - Task creation
   - Data export

## Log Aggregation

### Vercel Logs

If deployed on Vercel, logs are automatically aggregated:

```bash
# View logs
vercel logs

# Stream logs
vercel logs --follow

# Filter by function
vercel logs --function=api/tasks
```

### Datadog Setup

For enterprise log management:

1. Install Datadog agent:
   ```bash
   npm install dd-trace
   ```

2. Initialize in `instrumentation.ts`:
   ```typescript
   export function register() {
     if (process.env.DATADOG_API_KEY) {
       require('dd-trace').init({
         service: 'professional-life-platform',
         env: process.env.NODE_ENV,
         logInjection: true,
       })
     }
   }
   ```

3. Configure log forwarding:
   ```typescript
   import { logger } from '@/lib/logging'
   
   // Logs are automatically forwarded to Datadog
   logger.info('User action', { userId, action })
   ```

### CloudWatch Logs (AWS)

If deployed on AWS:

1. Install CloudWatch SDK:
   ```bash
   npm install @aws-sdk/client-cloudwatch-logs
   ```

2. Configure log streaming:
   ```typescript
   import { CloudWatchLogsClient, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs'
   
   const client = new CloudWatchLogsClient({ region: 'us-east-1' })
   
   export async function sendToCloudWatch(message: string, level: string) {
     await client.send(new PutLogEventsCommand({
       logGroupName: '/aws/professional-life-platform',
       logStreamName: 'application',
       logEvents: [{
         message,
         timestamp: Date.now(),
       }],
     }))
   }
   ```

## Alerting

### Alert Channels

Configure multiple alert channels:

1. **Email**: Primary notification method
2. **SMS**: Critical alerts only
3. **Slack**: Team notifications
4. **PagerDuty**: On-call rotations

### Alert Rules

#### Critical Alerts (Immediate Response)

- Database connection failures
- Application crashes
- Authentication system failures
- Data corruption detected
- Security breaches

#### High Priority Alerts (15-minute response)

- API error rate > 5%
- Response time > 2 seconds (p95)
- Memory usage > 90%
- CPU usage > 90%
- Disk space < 10%

#### Medium Priority Alerts (1-hour response)

- API error rate > 2%
- Response time > 1 second (p95)
- Cache hit rate < 70%
- Failed cron jobs

#### Low Priority Alerts (Daily review)

- Slow queries (> 500ms)
- High Redis memory usage
- Unusual traffic patterns

### Sentry Alerts

Configure in Sentry dashboard:

1. Go to Alerts → Create Alert Rule
2. Set conditions:
   - Error rate increases by 50%
   - New error types
   - Performance degradation

### Custom Alerts

Create custom alert endpoints:

```typescript
// app/api/alerts/webhook/route.ts
export async function POST(request: Request) {
  const alert = await request.json()
  
  // Send to Slack
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    body: JSON.stringify({
      text: `🚨 Alert: ${alert.title}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: alert.description,
          },
        },
      ],
    }),
  })
  
  return new Response('OK')
}
```

## Dashboards

### Vercel Analytics

Built-in analytics for Vercel deployments:

- Real User Monitoring (RUM)
- Web Vitals tracking
- Geographic distribution
- Device breakdown

### Custom Dashboard

Create a monitoring dashboard using the health endpoint:

```typescript
// components/admin/monitoring-dashboard.tsx
export function MonitoringDashboard() {
  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch('/health')
      return res.json()
    },
    refetchInterval: 30000, // 30 seconds
  })
  
  return (
    <div>
      <h2>System Health</h2>
      <StatusCard title="Database" status={health?.checks.database.status} />
      <StatusCard title="Redis" status={health?.checks.redis.status} />
      <StatusCard title="Memory" status={health?.checks.memory.status} />
    </div>
  )
}
```

### Grafana Dashboard

For advanced visualization:

1. Install Grafana
2. Add Prometheus data source
3. Import dashboard template
4. Configure panels for:
   - Request rate
   - Error rate
   - Response time (p50, p95, p99)
   - Database connections
   - Cache hit rate

## Metrics to Monitor

### Application Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API Response Time (p95) | < 200ms | > 1000ms |
| API Error Rate | < 1% | > 5% |
| Uptime | > 99.9% | < 99% |
| Request Rate | - | Sudden 10x increase |

### Database Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Query Time (p95) | < 100ms | > 500ms |
| Connection Pool Usage | < 70% | > 90% |
| Slow Queries | 0 | > 10/hour |
| Replication Lag | < 1s | > 10s |

### Infrastructure Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| CPU Usage | < 70% | > 90% |
| Memory Usage | < 80% | > 95% |
| Disk Usage | < 80% | > 90% |
| Network I/O | - | Unusual spikes |

### Business Metrics

| Metric | Description |
|--------|-------------|
| Daily Active Users | Users who logged in today |
| Task Completion Rate | % of tasks completed on time |
| Habit Streak Average | Average habit streak length |
| API Usage by Endpoint | Most/least used features |
| User Retention | 7-day, 30-day retention rates |

### Security Metrics

| Metric | Alert Threshold |
|--------|-----------------|
| Failed Login Attempts | > 10 from same IP |
| Rate Limit Violations | > 100/hour |
| Suspicious Activity | Pattern detection |
| Data Export Requests | > 10/day per user |

## Performance Benchmarks

### Target Performance

- **Time to First Byte (TTFB)**: < 200ms
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Cumulative Layout Shift (CLS)**: < 0.1

### API Endpoints

| Endpoint | Target Response Time |
|----------|---------------------|
| GET /api/tasks | < 100ms |
| POST /api/tasks | < 200ms |
| GET /api/analytics/overview | < 300ms |
| GET /api/export | < 5000ms |

## Troubleshooting

### High Error Rate

1. Check error tracking dashboard
2. Review recent deployments
3. Check database connectivity
4. Review application logs
5. Check external service status

### Slow Response Times

1. Check database query performance
2. Verify Redis is working
3. Review server resources
4. Check for N+1 queries
5. Analyze slow query logs

### Memory Leaks

1. Monitor memory usage over time
2. Check for unclosed connections
3. Review event listeners
4. Use heap snapshots
5. Profile with Chrome DevTools

## Best Practices

1. **Set up monitoring before launch**: Don't wait for issues to occur
2. **Monitor user-facing metrics**: Focus on what users experience
3. **Create runbooks**: Document response procedures for common issues
4. **Regular reviews**: Weekly review of metrics and alerts
5. **Test alerts**: Ensure alerts are working and reaching the right people
6. **Gradual rollouts**: Use feature flags for risky changes
7. **Capacity planning**: Monitor trends to predict resource needs

## Monitoring Checklist

Before going to production:

- [ ] Health check endpoint is working
- [ ] Error tracking is configured
- [ ] Uptime monitoring is set up
- [ ] Database monitoring is enabled
- [ ] Log aggregation is working
- [ ] Alerts are configured and tested
- [ ] Dashboard is accessible
- [ ] On-call rotation is established
- [ ] Runbooks are documented
- [ ] Performance benchmarks are established

## Resources

- [Next.js Monitoring](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [PostgreSQL Monitoring](https://www.postgresql.org/docs/current/monitoring.html)
- [Redis Monitoring](https://redis.io/docs/management/monitoring/)
- [Web Vitals](https://web.dev/vitals/)
