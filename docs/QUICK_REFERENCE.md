# Quick Reference Guide

Quick reference for common deployment and operational tasks.

## 🚀 Quick Deploy

```bash
# Vercel (Recommended)
vercel --prod

# Docker
docker-compose -f docker-compose.prod.yml up -d

# PM2
pm2 start npm --name "app" -- start
```

## 🔍 Health Check

```bash
# Check system health
curl https://your-domain.com/api/health | jq

# Expected response
{
  "status": "healthy",
  "checks": {
    "database": { "status": "healthy" },
    "redis": { "status": "healthy" },
    "memory": { "status": "healthy" }
  }
}
```

## 📊 Monitoring

### View Logs
```bash
# Vercel
vercel logs --follow

# Docker
docker logs -f container_name

# PM2
pm2 logs
```

### Check Metrics
- Health: `https://your-domain.com/api/health`
- Monitoring Dashboard: See MONITORING.md
- Error Tracking: Check Sentry dashboard

## 🗄️ Database

### Backup
```bash
# Create backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Compressed backup
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz
```

### Restore
```bash
# Restore from backup
psql $DATABASE_URL < backup.sql
```

### Migrations
```bash
# Run migrations
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Generate Prisma client
npx prisma generate
```

## 🔄 Rollback

```bash
# Vercel
vercel rollback

# Docker
docker-compose -f docker-compose.prod.yml down
docker pull your-registry/app:previous-tag
docker-compose -f docker-compose.prod.yml up -d

# Git
git checkout previous-commit-hash
vercel --prod
```

## 🔐 Security

### Generate Secrets
```bash
# Generate secure key
openssl rand -base64 32

# Generate multiple keys
for i in {1..3}; do openssl rand -base64 32; done
```

### Rotate Secrets
```bash
# Update environment variable
vercel env add NEXTAUTH_SECRET production

# Redeploy
vercel --prod
```

## 🧹 Maintenance

### Clear Cache
```bash
# Redis
redis-cli -u $REDIS_URL FLUSHALL

# Vercel
vercel --force
```

### Database Maintenance
```sql
-- Vacuum and analyze
VACUUM ANALYZE;

-- Reindex
REINDEX DATABASE production_db;
```

### Check Disk Space
```bash
df -h
```

### Check Memory
```bash
free -h
```

## 🚨 Emergency Procedures

### Enable Maintenance Mode
```bash
vercel env add MAINTENANCE_MODE true production
vercel --prod
```

### Disable Maintenance Mode
```bash
vercel env rm MAINTENANCE_MODE production
vercel --prod
```

### Kill Long-Running Queries
```sql
-- Find long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state != 'idle'
AND now() - pg_stat_activity.query_start > interval '5 minutes';

-- Kill query
SELECT pg_terminate_backend(pid);
```

## 📞 Emergency Contacts

- **On-Call Engineer:** Check PagerDuty schedule
- **Team Lead:** [contact info]
- **DevOps:** [contact info]

## 🔗 Quick Links

- [Full Deployment Guide](./DEPLOYMENT.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Operations Runbook](./RUNBOOK.md)
- [Monitoring Guide](./MONITORING.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)

## 📋 Common Issues

### Database Connection Error
```bash
# Check connection
psql $DATABASE_URL -c "SELECT 1"

# Verify SSL mode
# Add ?sslmode=require to DATABASE_URL
```

### Redis Connection Error
```bash
# Test Redis
redis-cli -u $REDIS_URL ping

# Should return: PONG
```

### High Memory Usage
```bash
# Check memory
curl https://your-domain.com/api/health | jq '.checks.memory'

# Restart if needed
pm2 restart all
```

### Slow Queries
```sql
-- Find slow queries
SELECT query, mean_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## 🧪 Testing

### Run the e2e suite

```bash
# Vitest (unit / property)
npm test

# Playwright (e2e — requires `npm run dev` running)
npx playwright test --project=laptop                  # all suites
npx playwright test crud.spec.ts --project=laptop     # one spec
```

See [`../Test.md`](../Test.md) for the per-feature spec mapping.

### Test Critical Flows in production

```bash
# Health check
curl https://your-domain.com/api/health

# API endpoint
curl https://your-domain.com/api/tasks

# Authentication
curl -X POST https://your-domain.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 📈 Performance

### Check Response Times
```bash
# Using curl
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/api/tasks

# curl-format.txt:
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
```

### Check Bundle Size
```bash
npm run build
# Review output for bundle sizes
```

## 🔄 Cron Jobs

### Manual Trigger
```bash
# Cleanup job
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.com/api/cron/cleanup

# Metrics aggregation
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain.com/api/cron/metrics-aggregation
```

## 📦 Environment Variables

### Required Variables
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Production domain
- `NEXTAUTH_SECRET` - Auth secret (32+ chars)
- `ENCRYPTION_KEY` - Encryption key (32+ chars)

### Optional Variables
- `ENABLE_REDIS` - Set to `"false"` to disable Redis caching (default: on if `REDIS_URL` is set)
- `REDIS_URL` - Redis connection string (only required if `ENABLE_REDIS=true`)
- `CRON_SECRET` - Cron job authentication (when set, `/api/cron/*` requires `Authorization: Bearer $CRON_SECRET`)
- `APM_DSN` - Application monitoring
- `ERROR_TRACKING_DSN` - Error tracking
- `LOG_LEVEL` - Logging level (info, debug, error)

### Check Variables
```bash
# Vercel
vercel env ls

# Local
env | grep -E "DATABASE|REDIS|NEXTAUTH"
```

## 🎯 Quick Wins

### Improve Performance
1. Enable Redis caching
2. Add database indexes
3. Optimize images
4. Enable CDN

### Improve Reliability
1. Set up monitoring
2. Configure alerts
3. Test backups
4. Document procedures

### Improve Security
1. Rotate secrets regularly
2. Enable rate limiting
3. Review audit logs
4. Update dependencies

## 📚 Documentation

For detailed information, see:
- **Setup:** [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Operations:** [RUNBOOK.md](./RUNBOOK.md)
- **Monitoring:** [MONITORING.md](./MONITORING.md)
- **Checklist:** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
