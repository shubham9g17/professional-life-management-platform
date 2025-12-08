# Production Deployment Guide

This guide covers deploying the Professional Life Management Platform to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Redis Configuration](#redis-configuration)
5. [CDN Configuration](#cdn-configuration)
6. [Deployment Platforms](#deployment-platforms)
7. [Post-Deployment](#post-deployment)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying to production, ensure you have:

- [ ] Node.js 18+ installed
- [ ] PostgreSQL database (managed service recommended)
- [ ] Redis instance (managed service recommended)
- [ ] Domain name configured with SSL/TLS
- [ ] Environment variables prepared
- [ ] Monitoring tools configured (optional but recommended)

## Environment Setup

### 1. Generate Secure Keys

Run the setup script to generate secure keys:

```bash
cd professional-life-management-platform
chmod +x scripts/setup-production.sh
./scripts/setup-production.sh
```

Or manually generate keys:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -base64 32

# Generate CRON_SECRET (optional)
openssl rand -base64 32
```

### 2. Configure Environment Variables

Copy the production environment template:

```bash
cp .env.production.example .env.production
```

Update the following critical variables in `.env.production`:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public&sslmode=require"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="<generated-secret>"

# Redis
REDIS_URL="redis://default:password@host:6379"

# Security
ENCRYPTION_KEY="<generated-key>"
CRON_SECRET="<generated-secret>"
```

## Database Configuration

### PostgreSQL Setup

#### Option 1: Managed Service (Recommended)

Use a managed PostgreSQL service:

- **Supabase**: Free tier available, automatic backups
- **Railway**: Simple setup, good for small to medium apps
- **AWS RDS**: Enterprise-grade, highly scalable
- **DigitalOcean Managed Databases**: Good balance of features and cost

#### Option 2: Self-Hosted

If self-hosting PostgreSQL:

1. Install PostgreSQL 14+
2. Create a database:
   ```sql
   CREATE DATABASE production_db;
   CREATE USER app_user WITH ENCRYPTED PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE production_db TO app_user;
   ```
3. Configure SSL/TLS for secure connections
4. Set up regular backups

### Run Migrations

After configuring the database:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify connection
npx prisma db pull
```

### Database Optimization

Add these PostgreSQL configurations for optimal performance:

```sql
-- Connection pooling
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET max_wal_size = '4GB';

-- Reload configuration
SELECT pg_reload_conf();
```

## Redis Configuration

### Redis Setup

#### Option 1: Managed Service (Recommended)

Use a managed Redis service:

- **Upstash**: Serverless Redis, pay-per-request
- **Redis Cloud**: Official Redis managed service
- **AWS ElastiCache**: Enterprise-grade caching
- **DigitalOcean Managed Redis**: Simple and affordable

#### Option 2: Self-Hosted

If self-hosting Redis:

1. Install Redis 6+
2. Configure Redis for production:
   ```conf
   # /etc/redis/redis.conf
   bind 0.0.0.0
   protected-mode yes
   requirepass your_secure_password
   maxmemory 256mb
   maxmemory-policy allkeys-lru
   save 900 1
   save 300 10
   save 60 10000
   ```
3. Enable persistence (RDB or AOF)
4. Set up monitoring

### Redis Connection

Update your Redis URL in `.env.production`:

```env
REDIS_URL="redis://default:password@your-redis-host:6379"
```

## CDN Configuration

### Option 1: Vercel Edge Network (Automatic)

If deploying to Vercel, CDN is automatically configured.

### Option 2: Cloudflare

1. Add your domain to Cloudflare
2. Update DNS records to point to your hosting provider
3. Enable Cloudflare proxy (orange cloud)
4. Configure caching rules:
   - Cache static assets: `/_next/static/*`
   - Cache images: `/images/*`
   - Bypass cache for API routes: `/api/*`

### Option 3: AWS CloudFront

1. Create a CloudFront distribution
2. Set origin to your application domain
3. Configure cache behaviors:
   ```json
   {
     "PathPattern": "/_next/static/*",
     "MinTTL": 31536000,
     "DefaultTTL": 31536000,
     "MaxTTL": 31536000
   }
   ```

## Deployment Platforms

### Vercel (Recommended)

Vercel provides the best Next.js deployment experience.

#### Setup

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Link your project:
   ```bash
   vercel link
   ```

4. Add environment variables:
   ```bash
   vercel env add DATABASE_URL production
   vercel env add NEXTAUTH_URL production
   vercel env add NEXTAUTH_SECRET production
   vercel env add REDIS_URL production
   vercel env add ENCRYPTION_KEY production
   vercel env add CRON_SECRET production
   ```

5. Deploy:
   ```bash
   vercel --prod
   ```

#### Vercel Configuration

The `vercel.json` file is already configured with:
- Security headers
- Caching rules
- Cron jobs
- Function timeouts

### Docker Deployment

#### Build Docker Image

```bash
# Build image
docker build -t professional-life-platform:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e NEXTAUTH_SECRET="..." \
  -e REDIS_URL="redis://..." \
  -e ENCRYPTION_KEY="..." \
  professional-life-platform:latest
```

#### Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - REDIS_URL=${REDIS_URL}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=production_db
      - POSTGRES_USER=app_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### AWS / DigitalOcean / Other Platforms

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

3. Use a process manager like PM2:
   ```bash
   npm i -g pm2
   pm2 start npm --name "professional-life-platform" -- start
   pm2 save
   pm2 startup
   ```

## Post-Deployment

### 1. Verify Deployment

Check the health endpoint:

```bash
curl https://your-domain.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "database": { "status": "healthy" },
    "redis": { "status": "healthy" },
    "memory": { "status": "healthy" }
  }
}
```

### 2. Test Critical Flows

- [ ] User registration
- [ ] User login
- [ ] Task creation
- [ ] Habit tracking
- [ ] Financial transaction
- [ ] Data export

### 3. Configure Cron Jobs

If not using Vercel, set up cron jobs manually:

```bash
# Add to crontab
crontab -e

# Daily cleanup at 2 AM
0 2 * * * curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/cleanup

# Hourly metrics aggregation
0 * * * * curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/metrics-aggregation
```

### 4. Set Up Backups

#### Database Backups

```bash
# Daily PostgreSQL backup
0 3 * * * pg_dump -h host -U user -d dbname | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz

# Retention: Keep last 30 days
find /backups -name "db-*.sql.gz" -mtime +30 -delete
```

#### Redis Backups

Redis automatically creates RDB snapshots based on configuration.

### 5. SSL/TLS Configuration

Ensure HTTPS is enabled:

- Use Let's Encrypt for free SSL certificates
- Configure automatic renewal
- Enforce HTTPS redirects
- Enable HSTS headers (already configured in `vercel.json`)

## Monitoring

### Application Performance Monitoring (APM)

#### Option 1: Sentry

1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project
3. Add DSN to environment variables:
   ```env
   ERROR_TRACKING_DSN="https://...@sentry.io/..."
   ```

#### Option 2: New Relic

1. Sign up at [newrelic.com](https://newrelic.com)
2. Install New Relic agent:
   ```bash
   npm install newrelic
   ```
3. Configure `newrelic.js`

### Uptime Monitoring

Use services like:
- **UptimeRobot**: Free tier available
- **Pingdom**: Comprehensive monitoring
- **StatusCake**: Good free tier

Configure to check `/health` endpoint every 5 minutes.

### Log Aggregation

The application uses structured logging. Aggregate logs using:

- **Vercel Logs**: Built-in for Vercel deployments
- **Datadog**: Enterprise-grade log management
- **Logtail**: Simple and affordable
- **CloudWatch**: For AWS deployments

## Troubleshooting

### Common Issues

#### Database Connection Errors

```
Error: Can't reach database server
```

**Solutions:**
- Verify DATABASE_URL is correct
- Check database server is running
- Verify SSL mode is correct (`sslmode=require` for production)
- Check firewall rules allow connections

#### Redis Connection Errors

```
Error: Redis connection failed
```

**Solutions:**
- Verify REDIS_URL is correct
- Check Redis server is running
- Verify password is correct
- Check network connectivity

#### Build Failures

```
Error: Module not found
```

**Solutions:**
- Run `npm install` to ensure all dependencies are installed
- Clear `.next` directory: `rm -rf .next`
- Verify Node.js version is 18+

#### Performance Issues

**Slow API responses:**
- Check database query performance
- Verify Redis is working (caching)
- Review database indexes
- Check server resources (CPU, memory)

**High memory usage:**
- Check for memory leaks
- Review connection pool settings
- Monitor with APM tools

### Debug Mode

Enable debug logging temporarily:

```env
LOG_LEVEL="debug"
```

### Support

For additional help:
- Check application logs
- Review error tracking dashboard
- Contact your hosting provider support
- Review Next.js documentation

## Security Checklist

Before going live:

- [ ] All environment variables are set correctly
- [ ] Secrets are not committed to version control
- [ ] HTTPS is enabled and enforced
- [ ] Database uses SSL/TLS connections
- [ ] Rate limiting is configured
- [ ] CORS is properly configured
- [ ] Security headers are set
- [ ] Regular backups are configured
- [ ] Monitoring and alerting are set up
- [ ] Error tracking is configured

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error rates
- Check uptime status
- Review performance metrics

**Weekly:**
- Review security alerts
- Check backup integrity
- Update dependencies (if needed)

**Monthly:**
- Review and optimize database queries
- Analyze user metrics
- Update documentation

### Updates

To deploy updates:

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run migrations (if any)
npx prisma migrate deploy

# Build and deploy
vercel --prod
```

## Rollback Procedure

If issues occur after deployment:

1. **Vercel:**
   ```bash
   vercel rollback
   ```

2. **Docker:**
   ```bash
   docker pull professional-life-platform:previous-tag
   docker-compose up -d
   ```

3. **Database:**
   ```bash
   # Restore from backup
   psql -h host -U user -d dbname < backup.sql
   ```

## Performance Optimization

### Database

- Regularly run `VACUUM ANALYZE` on PostgreSQL
- Monitor slow queries
- Add indexes for frequently queried columns
- Use connection pooling

### Caching

- Monitor Redis hit rates
- Adjust TTL values based on usage patterns
- Use cache warming for critical data

### CDN

- Maximize cache hit rates
- Use appropriate cache headers
- Optimize image sizes

## Conclusion

Your Professional Life Management Platform is now deployed to production! Monitor the application closely in the first few days and be prepared to make adjustments based on real-world usage patterns.

For questions or issues, refer to the troubleshooting section or contact support.
