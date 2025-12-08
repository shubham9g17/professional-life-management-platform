# Troubleshooting Guide

This guide helps diagnose and resolve common issues with the Professional Life Management Platform.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Database Issues](#database-issues)
3. [Authentication Issues](#authentication-issues)
4. [Performance Issues](#performance-issues)
5. [Deployment Issues](#deployment-issues)
6. [API Errors](#api-errors)
7. [Caching Issues](#caching-issues)
8. [Security Issues](#security-issues)
9. [Data Issues](#data-issues)
10. [Getting Help](#getting-help)

## Quick Diagnostics

### Health Check

First, check the system health:

```bash
curl https://your-domain.com/health
```

Expected healthy response:
```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "healthy" },
    "redis": { "status": "healthy" },
    "memory": { "status": "healthy" }
  }
}
```

### Check Logs

View recent logs:

```bash
# Vercel
vercel logs --follow

# Docker
docker logs -f container_name

# PM2
pm2 logs
```

### Check Environment Variables

Verify all required environment variables are set:

```bash
# Check if variables are set
echo $DATABASE_URL
echo $NEXTAUTH_SECRET
echo $REDIS_URL
```

## Database Issues

### Issue: "Can't reach database server"

**Symptoms:**
- Health check shows database as unhealthy
- API requests fail with database connection errors
- Application crashes on startup

**Diagnosis:**

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Check if database is running
pg_isready -h hostname -p 5432
```

**Solutions:**

1. **Verify connection string:**
   ```env
   # Correct format
   DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public&sslmode=require"
   ```

2. **Check firewall rules:**
   - Ensure your application server can reach the database
   - Verify security group/firewall allows connections on port 5432

3. **Verify SSL mode:**
   ```env
   # For production, use SSL
   DATABASE_URL="...?sslmode=require"
   
   # For development without SSL
   DATABASE_URL="...?sslmode=disable"
   ```

4. **Check connection pool:**
   ```typescript
   // Increase pool size if needed
   const prisma = new PrismaClient({
     datasources: {
       db: {
         url: process.env.DATABASE_URL,
       },
     },
   })
   ```

5. **Restart the application:**
   ```bash
   # Vercel
   vercel --prod
   
   # Docker
   docker-compose restart
   
   # PM2
   pm2 restart all
   ```

### Issue: "Too many connections"

**Symptoms:**
- Error: "remaining connection slots are reserved"
- Intermittent database connection failures

**Solutions:**

1. **Check active connections:**
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```

2. **Reduce connection pool size:**
   ```env
   DATABASE_POOL_MAX=5
   ```

3. **Close idle connections:**
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle'
   AND state_change < current_timestamp - INTERVAL '5 minutes';
   ```

### Issue: Slow queries

**Symptoms:**
- API responses are slow
- Database CPU usage is high
- Timeout errors

**Diagnosis:**

```sql
-- Find slow queries
SELECT 
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**Solutions:**

1. **Add missing indexes:**
   ```sql
   -- Check for missing indexes
   SELECT schemaname, tablename, attname, n_distinct, correlation
   FROM pg_stats
   WHERE schemaname = 'public'
   AND n_distinct > 100
   ORDER BY n_distinct DESC;
   
   -- Add index
   CREATE INDEX idx_tasks_user_status ON "Task"(userId, status);
   ```

2. **Optimize queries:**
   - Use `select` to limit returned fields
   - Add `where` clauses to filter data
   - Use pagination for large result sets

3. **Enable query logging:**
   ```typescript
   const prisma = new PrismaClient({
     log: ['query', 'error', 'warn'],
   })
   ```

## Authentication Issues

### Issue: "Invalid credentials"

**Symptoms:**
- Users cannot log in
- "Invalid email or password" error

**Diagnosis:**

```bash
# Check if user exists
psql $DATABASE_URL -c "SELECT id, email FROM \"User\" WHERE email = 'user@example.com';"
```

**Solutions:**

1. **Verify password hashing:**
   ```typescript
   import bcrypt from 'bcryptjs'
   
   // Test password
   const isValid = await bcrypt.compare(password, user.passwordHash)
   console.log('Password valid:', isValid)
   ```

2. **Check NEXTAUTH_SECRET:**
   ```env
   # Must be set and consistent across deployments
   NEXTAUTH_SECRET="your-secret-here"
   ```

3. **Clear browser cookies:**
   - Clear cookies for your domain
   - Try in incognito mode

### Issue: "Session expired" or "Unauthorized"

**Symptoms:**
- Users are logged out unexpectedly
- API requests return 401 Unauthorized

**Solutions:**

1. **Check session configuration:**
   ```typescript
   // lib/auth/config.ts
   export const authOptions = {
     session: {
       strategy: 'jwt',
       maxAge: 7 * 24 * 60 * 60, // 7 days
     },
   }
   ```

2. **Verify NEXTAUTH_URL:**
   ```env
   # Must match your domain exactly
   NEXTAUTH_URL="https://your-domain.com"
   ```

3. **Check for clock skew:**
   - Ensure server time is synchronized
   - Use NTP to sync time

### Issue: CSRF token mismatch

**Symptoms:**
- Form submissions fail
- "CSRF token mismatch" error

**Solutions:**

1. **Ensure cookies are enabled:**
   - Check browser settings
   - Verify SameSite cookie settings

2. **Check CORS configuration:**
   ```typescript
   // middleware.ts
   export function middleware(request: NextRequest) {
     const response = NextResponse.next()
     response.headers.set('Access-Control-Allow-Origin', process.env.NEXTAUTH_URL!)
     return response
   }
   ```

## Performance Issues

### Issue: Slow page loads

**Symptoms:**
- Pages take > 3 seconds to load
- Poor Lighthouse scores
- Users complain about slowness

**Diagnosis:**

```bash
# Run Lighthouse audit
npx lighthouse https://your-domain.com --view

# Check Web Vitals
curl https://your-domain.com/api/web-vitals
```

**Solutions:**

1. **Enable caching:**
   ```typescript
   // Verify Redis is working
   import { redis } from '@/lib/redis'
   await redis.ping() // Should return 'PONG'
   ```

2. **Optimize images:**
   ```typescript
   // Use Next.js Image component
   import Image from 'next/image'
   
   <Image
     src="/image.jpg"
     width={800}
     height={600}
     alt="Description"
     priority // For above-the-fold images
   />
   ```

3. **Enable code splitting:**
   ```typescript
   // Use dynamic imports
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <LoadingSpinner />,
   })
   ```

4. **Check bundle size:**
   ```bash
   npm run build
   # Review bundle sizes in output
   ```

### Issue: High memory usage

**Symptoms:**
- Memory usage > 90%
- Application crashes with "Out of memory"
- Slow performance

**Diagnosis:**

```bash
# Check memory usage
curl https://your-domain.com/health | jq '.checks.memory'

# Node.js heap snapshot
node --inspect index.js
# Then use Chrome DevTools to take heap snapshot
```

**Solutions:**

1. **Increase memory limit:**
   ```json
   // package.json
   {
     "scripts": {
       "start": "NODE_OPTIONS='--max-old-space-size=2048' next start"
     }
   }
   ```

2. **Fix memory leaks:**
   - Close database connections
   - Remove event listeners
   - Clear intervals/timeouts

3. **Optimize queries:**
   - Use pagination
   - Limit result sets
   - Use streaming for large data

### Issue: High CPU usage

**Symptoms:**
- CPU usage > 80%
- Slow response times
- Timeout errors

**Solutions:**

1. **Identify CPU-intensive operations:**
   ```bash
   # Profile with Node.js
   node --prof index.js
   node --prof-process isolate-*.log
   ```

2. **Optimize algorithms:**
   - Use efficient data structures
   - Cache expensive calculations
   - Move heavy processing to background jobs

3. **Scale horizontally:**
   - Add more instances
   - Use load balancing

## Deployment Issues

### Issue: Build fails

**Symptoms:**
- `npm run build` fails
- Deployment fails on hosting platform

**Common Errors:**

#### TypeScript errors

```bash
# Check for type errors
npx tsc --noEmit

# Fix common issues
npm install --save-dev @types/node @types/react
```

#### Missing dependencies

```bash
# Install all dependencies
npm install

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Environment variables not set

```bash
# Verify all required variables
cat .env.production

# Set missing variables
vercel env add VARIABLE_NAME production
```

### Issue: Deployment succeeds but site doesn't work

**Symptoms:**
- Deployment completes successfully
- Site shows errors or blank page

**Solutions:**

1. **Check build output:**
   ```bash
   # Look for errors in build logs
   vercel logs
   ```

2. **Verify environment variables:**
   ```bash
   # List all environment variables
   vercel env ls
   ```

3. **Check database migrations:**
   ```bash
   # Run migrations
   npx prisma migrate deploy
   ```

4. **Clear cache:**
   ```bash
   # Clear Vercel cache
   vercel --force
   ```

### Issue: Database migrations fail

**Symptoms:**
- Migration errors during deployment
- Schema mismatch errors

**Solutions:**

1. **Check migration status:**
   ```bash
   npx prisma migrate status
   ```

2. **Reset database (development only):**
   ```bash
   npx prisma migrate reset
   ```

3. **Deploy migrations manually:**
   ```bash
   npx prisma migrate deploy
   ```

4. **Resolve conflicts:**
   ```bash
   # Create a new migration to fix conflicts
   npx prisma migrate dev --name fix_conflicts
   ```

## API Errors

### Issue: 500 Internal Server Error

**Symptoms:**
- API requests return 500 errors
- Generic error messages

**Diagnosis:**

```bash
# Check error logs
vercel logs --follow

# Check specific endpoint
curl -v https://your-domain.com/api/tasks
```

**Solutions:**

1. **Check error tracking:**
   - Review Sentry dashboard
   - Look for stack traces

2. **Add error logging:**
   ```typescript
   try {
     // Your code
   } catch (error) {
     logger.error('Operation failed', { error, context })
     throw error
   }
   ```

3. **Verify request format:**
   ```bash
   # Test with curl
   curl -X POST https://your-domain.com/api/tasks \
     -H "Content-Type: application/json" \
     -d '{"title":"Test","workspace":"PERSONAL"}'
   ```

### Issue: 401 Unauthorized

**Symptoms:**
- API requests fail with 401
- "Unauthorized" error

**Solutions:**

1. **Check authentication:**
   ```bash
   # Get session token
   curl -c cookies.txt https://your-domain.com/api/auth/signin
   
   # Use token in request
   curl -b cookies.txt https://your-domain.com/api/tasks
   ```

2. **Verify middleware:**
   ```typescript
   // middleware.ts
   export function middleware(request: NextRequest) {
     const token = await getToken({ req: request })
     if (!token) {
       return NextResponse.redirect('/auth/signin')
     }
   }
   ```

### Issue: 429 Too Many Requests

**Symptoms:**
- Requests are rate limited
- "Too many requests" error

**Solutions:**

1. **Check rate limit configuration:**
   ```typescript
   // lib/rate-limit.ts
   export const rateLimit = {
     max: 100, // requests
     window: 60000, // 1 minute
   }
   ```

2. **Implement exponential backoff:**
   ```typescript
   async function retryWithBackoff(fn, maxRetries = 3) {
     for (let i = 0; i < maxRetries; i++) {
       try {
         return await fn()
       } catch (error) {
         if (i === maxRetries - 1) throw error
         await new Promise(resolve => setTimeout(resolve, 2 ** i * 1000))
       }
     }
   }
   ```

## Caching Issues

### Issue: Stale data

**Symptoms:**
- Users see outdated information
- Changes don't appear immediately

**Solutions:**

1. **Clear cache:**
   ```typescript
   import { redis } from '@/lib/redis'
   
   // Clear specific key
   await redis.del('cache:key')
   
   // Clear pattern
   const keys = await redis.keys('cache:user:*')
   if (keys.length > 0) {
     await redis.del(...keys)
   }
   ```

2. **Reduce TTL:**
   ```typescript
   // Set shorter cache duration
   await redis.setex('key', 60, value) // 60 seconds
   ```

3. **Invalidate on updates:**
   ```typescript
   // After updating data
   await prisma.task.update({ ... })
   await redis.del(`cache:tasks:${userId}`)
   ```

### Issue: Redis connection errors

**Symptoms:**
- Cache operations fail
- "Redis connection refused" error

**Solutions:**

1. **Verify Redis is running:**
   ```bash
   redis-cli ping
   # Should return PONG
   ```

2. **Check connection string:**
   ```env
   REDIS_URL="redis://default:password@host:6379"
   ```

3. **Test connection:**
   ```typescript
   import { redis } from '@/lib/redis'
   
   try {
     await redis.ping()
     console.log('Redis connected')
   } catch (error) {
     console.error('Redis connection failed:', error)
   }
   ```

## Security Issues

### Issue: Suspicious activity detected

**Symptoms:**
- Multiple failed login attempts
- Unusual traffic patterns
- Security alerts

**Actions:**

1. **Check audit logs:**
   ```sql
   SELECT * FROM "AuditLog"
   WHERE action = 'LOGIN_FAILED'
   AND "createdAt" > NOW() - INTERVAL '1 hour'
   ORDER BY "createdAt" DESC;
   ```

2. **Block suspicious IPs:**
   ```typescript
   // middleware.ts
   const blockedIPs = ['1.2.3.4', '5.6.7.8']
   
   if (blockedIPs.includes(request.ip)) {
     return new Response('Forbidden', { status: 403 })
   }
   ```

3. **Reset user password:**
   ```sql
   -- Force password reset
   UPDATE "User"
   SET "passwordResetRequired" = true
   WHERE email = 'user@example.com';
   ```

### Issue: Data breach suspected

**Actions:**

1. **Immediately:**
   - Enable maintenance mode
   - Disconnect database from internet
   - Preserve logs for investigation

2. **Investigate:**
   - Review audit logs
   - Check for unauthorized access
   - Identify affected users

3. **Notify:**
   - Inform affected users
   - Report to authorities if required
   - Document incident

## Data Issues

### Issue: Data corruption

**Symptoms:**
- Inconsistent data
- Validation errors
- Missing relationships

**Solutions:**

1. **Restore from backup:**
   ```bash
   # Stop application
   pm2 stop all
   
   # Restore database
   psql $DATABASE_URL < backup.sql
   
   # Restart application
   pm2 start all
   ```

2. **Run data integrity checks:**
   ```sql
   -- Check for orphaned records
   SELECT * FROM "Task"
   WHERE "userId" NOT IN (SELECT id FROM "User");
   
   -- Fix orphaned records
   DELETE FROM "Task"
   WHERE "userId" NOT IN (SELECT id FROM "User");
   ```

### Issue: Data migration failed

**Symptoms:**
- Migration errors
- Schema mismatch
- Missing columns

**Solutions:**

1. **Check migration status:**
   ```bash
   npx prisma migrate status
   ```

2. **Resolve failed migration:**
   ```bash
   # Mark migration as rolled back
   npx prisma migrate resolve --rolled-back "migration_name"
   
   # Apply migration again
   npx prisma migrate deploy
   ```

3. **Create fix migration:**
   ```bash
   npx prisma migrate dev --name fix_schema
   ```

## Getting Help

### Before Asking for Help

Gather this information:

1. **Error message:** Full error text and stack trace
2. **Steps to reproduce:** What actions lead to the error
3. **Environment:** Production, staging, or development
4. **Recent changes:** Recent deployments or configuration changes
5. **Logs:** Relevant log entries
6. **Health check:** Output from `/health` endpoint

### Support Channels

1. **Documentation:** Check this guide and other docs
2. **Logs:** Review application and error logs
3. **Monitoring:** Check monitoring dashboards
4. **Team:** Contact your development team
5. **Hosting provider:** Contact support for infrastructure issues

### Emergency Contacts

For critical production issues:

- **On-call engineer:** Check on-call schedule
- **Team lead:** [contact info]
- **DevOps:** [contact info]

### Useful Commands

```bash
# Quick health check
curl https://your-domain.com/health | jq

# View logs
vercel logs --follow

# Check database
psql $DATABASE_URL -c "SELECT version();"

# Check Redis
redis-cli -u $REDIS_URL ping

# Test API endpoint
curl -v https://your-domain.com/api/tasks

# Check environment
env | grep -E "DATABASE|REDIS|NEXTAUTH"

# Restart application
pm2 restart all

# Clear cache
redis-cli -u $REDIS_URL FLUSHALL
```

## Preventive Measures

To avoid issues:

1. **Monitor proactively:** Set up alerts before issues occur
2. **Test thoroughly:** Test changes in staging before production
3. **Backup regularly:** Automated daily backups
4. **Document changes:** Keep changelog updated
5. **Review logs:** Regular log reviews
6. **Update dependencies:** Keep dependencies up to date
7. **Security audits:** Regular security reviews
8. **Load testing:** Test under expected load
9. **Disaster recovery:** Have recovery procedures documented
10. **Training:** Ensure team knows troubleshooting procedures
