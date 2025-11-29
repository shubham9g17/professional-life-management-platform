# Operations Runbook

This runbook contains step-by-step procedures for common operational tasks for the Professional Life Management Platform.

## Table of Contents

1. [Deployment Procedures](#deployment-procedures)
2. [Rollback Procedures](#rollback-procedures)
3. [Database Operations](#database-operations)
4. [Incident Response](#incident-response)
5. [Maintenance Tasks](#maintenance-tasks)
6. [Scaling Operations](#scaling-operations)
7. [Security Procedures](#security-procedures)
8. [Backup and Recovery](#backup-and-recovery)

## Deployment Procedures

### Standard Deployment

**When:** Deploying new features or bug fixes to production

**Prerequisites:**
- [ ] All tests passing in CI/CD
- [ ] Code reviewed and approved
- [ ] Staging deployment successful
- [ ] Database migrations tested
- [ ] Rollback plan prepared

**Steps:**

1. **Notify team:**
   ```bash
   # Post in #deployments channel
   "🚀 Starting deployment of v1.2.3 to production at [time]"
   ```

2. **Create deployment tag:**
   ```bash
   git tag -a v1.2.3 -m "Release v1.2.3"
   git push origin v1.2.3
   ```

3. **Run database migrations (if any):**
   ```bash
   # Connect to production database
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   
   # Verify migration
   npx prisma migrate status
   ```

4. **Deploy application:**
   ```bash
   # Vercel
   vercel --prod
   
   # Or Docker
   docker-compose -f docker-compose.prod.yml up -d
   ```

5. **Verify deployment:**
   ```bash
   # Check health
   curl https://your-domain.com/health
   
   # Check version
   curl https://your-domain.com/api/version
   
   # Test critical endpoints
   curl https://your-domain.com/api/tasks
   ```

6. **Monitor for issues:**
   - Watch error tracking dashboard (5 minutes)
   - Monitor response times (5 minutes)
   - Check for increased error rates

7. **Notify completion:**
   ```bash
   "✅ Deployment of v1.2.3 completed successfully"
   ```

**Rollback if:**
- Error rate increases > 5%
- Critical functionality broken
- Database issues detected
- Performance degradation > 50%

### Hotfix Deployment

**When:** Deploying urgent fixes to production

**Steps:**

1. **Create hotfix branch:**
   ```bash
   git checkout -b hotfix/critical-bug main
   ```

2. **Make fix and test:**
   ```bash
   # Make changes
   npm test
   npm run build
   ```

3. **Fast-track review:**
   - Get immediate code review
   - Test in staging (abbreviated)

4. **Deploy immediately:**
   ```bash
   git checkout main
   git merge hotfix/critical-bug
   git push origin main
   vercel --prod
   ```

5. **Monitor closely:**
   - Watch for 15 minutes
   - Verify fix is working

### Database Migration Deployment

**When:** Deploying schema changes

**Prerequisites:**
- [ ] Migration tested in staging
- [ ] Backup created
- [ ] Downtime window scheduled (if needed)
- [ ] Rollback migration prepared

**Steps:**

1. **Create backup:**
   ```bash
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
   ```

2. **Enable maintenance mode (if needed):**
   ```bash
   # Set environment variable
   vercel env add MAINTENANCE_MODE true production
   vercel --prod
   ```

3. **Run migration:**
   ```bash
   npx prisma migrate deploy
   ```

4. **Verify schema:**
   ```bash
   npx prisma db pull
   npx prisma validate
   ```

5. **Disable maintenance mode:**
   ```bash
   vercel env rm MAINTENANCE_MODE production
   vercel --prod
   ```

6. **Test application:**
   - Verify all CRUD operations
   - Check data integrity
   - Test affected features

## Rollback Procedures

### Application Rollback

**When:** Critical issues detected after deployment

**Steps:**

1. **Identify last known good version:**
   ```bash
   git log --oneline -10
   # Note the commit hash of last good version
   ```

2. **Rollback on Vercel:**
   ```bash
   # List recent deployments
   vercel ls
   
   # Promote previous deployment
   vercel promote [deployment-url]
   
   # Or redeploy previous version
   git checkout [commit-hash]
   vercel --prod
   ```

3. **Rollback on Docker:**
   ```bash
   # Pull previous image
   docker pull your-registry/app:previous-tag
   
   # Update docker-compose
   # Change image tag to previous version
   
   # Restart
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Verify rollback:**
   ```bash
   curl https://your-domain.com/health
   curl https://your-domain.com/api/version
   ```

5. **Notify team:**
   ```bash
   "⚠️ Rolled back to v1.2.2 due to [issue]"
   ```

### Database Rollback

**When:** Migration causes issues

**Steps:**

1. **Stop application:**
   ```bash
   # Prevent new database operations
   vercel env add MAINTENANCE_MODE true production
   ```

2. **Restore from backup:**
   ```bash
   # Drop current database (CAREFUL!)
   dropdb production_db
   
   # Create new database
   createdb production_db
   
   # Restore backup
   psql production_db < backup-20240101-120000.sql
   ```

3. **Or rollback migration:**
   ```bash
   # Mark migration as rolled back
   npx prisma migrate resolve --rolled-back "migration_name"
   
   # Apply previous migrations
   npx prisma migrate deploy
   ```

4. **Restart application:**
   ```bash
   vercel env rm MAINTENANCE_MODE production
   vercel --prod
   ```

## Database Operations

### Create Backup

**When:** Before major changes, daily automated backups

**Steps:**

1. **Manual backup:**
   ```bash
   # Full backup
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
   
   # Compressed backup
   pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d-%H%M%S).sql.gz
   
   # Schema only
   pg_dump --schema-only $DATABASE_URL > schema-$(date +%Y%m%d).sql
   ```

2. **Verify backup:**
   ```bash
   # Check file size
   ls -lh backup-*.sql.gz
   
   # Test restore (in test database)
   psql test_db < backup-20240101-120000.sql
   ```

3. **Upload to storage:**
   ```bash
   # AWS S3
   aws s3 cp backup-20240101-120000.sql.gz s3://backups/
   
   # Or use your backup service
   ```

### Restore from Backup

**When:** Data corruption, accidental deletion, disaster recovery

**Steps:**

1. **Download backup:**
   ```bash
   # From S3
   aws s3 cp s3://backups/backup-20240101-120000.sql.gz .
   
   # Decompress
   gunzip backup-20240101-120000.sql.gz
   ```

2. **Stop application:**
   ```bash
   vercel env add MAINTENANCE_MODE true production
   ```

3. **Restore database:**
   ```bash
   # Drop and recreate (CAREFUL!)
   dropdb production_db
   createdb production_db
   
   # Restore
   psql production_db < backup-20240101-120000.sql
   ```

4. **Verify data:**
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"User\";"
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Task\";"
   ```

5. **Restart application:**
   ```bash
   vercel env rm MAINTENANCE_MODE production
   vercel --prod
   ```

### Database Maintenance

**When:** Weekly or when performance degrades

**Steps:**

1. **Analyze tables:**
   ```sql
   ANALYZE VERBOSE;
   ```

2. **Vacuum database:**
   ```sql
   -- Regular vacuum
   VACUUM VERBOSE;
   
   -- Full vacuum (requires downtime)
   VACUUM FULL VERBOSE;
   ```

3. **Reindex:**
   ```sql
   -- Reindex specific table
   REINDEX TABLE "Task";
   
   -- Reindex all tables
   REINDEX DATABASE production_db;
   ```

4. **Update statistics:**
   ```sql
   ANALYZE;
   ```

## Incident Response

### Critical Incident (P0)

**Definition:** Complete service outage, data loss, security breach

**Steps:**

1. **Immediate (0-5 minutes):**
   - [ ] Acknowledge incident in monitoring system
   - [ ] Post in #incidents channel
   - [ ] Page on-call engineer
   - [ ] Start incident log

2. **Triage (5-15 minutes):**
   - [ ] Assess impact (users affected, data at risk)
   - [ ] Identify root cause
   - [ ] Determine if rollback needed
   - [ ] Escalate if needed

3. **Mitigation (15-60 minutes):**
   - [ ] Implement fix or rollback
   - [ ] Verify service restored
   - [ ] Monitor for stability

4. **Communication:**
   - [ ] Update status page
   - [ ] Notify affected users
   - [ ] Post updates every 30 minutes

5. **Post-Incident (24-48 hours):**
   - [ ] Write incident report
   - [ ] Conduct post-mortem
   - [ ] Create action items
   - [ ] Update runbooks

### High Priority Incident (P1)

**Definition:** Partial outage, major feature broken

**Steps:**

1. **Immediate (0-15 minutes):**
   - [ ] Acknowledge incident
   - [ ] Post in #incidents channel
   - [ ] Notify on-call engineer

2. **Investigation (15-60 minutes):**
   - [ ] Identify affected components
   - [ ] Check recent changes
   - [ ] Review logs and metrics

3. **Resolution (1-4 hours):**
   - [ ] Implement fix
   - [ ] Test thoroughly
   - [ ] Deploy fix
   - [ ] Monitor

### Incident Communication Template

```markdown
**Incident Update**

**Status:** [Investigating/Identified/Monitoring/Resolved]
**Impact:** [Description of user impact]
**Started:** [Time]
**Last Update:** [Time]

**What happened:**
[Brief description]

**Current status:**
[What we're doing now]

**Next update:**
[When we'll update again]
```

## Maintenance Tasks

### Daily Tasks

**Automated:**
- Database backups (2 AM)
- Log rotation
- Metrics aggregation
- Cleanup old data

**Manual:**
- [ ] Check monitoring dashboards
- [ ] Review error rates
- [ ] Check disk space
- [ ] Review security alerts

### Weekly Tasks

- [ ] Review slow queries
- [ ] Check backup integrity
- [ ] Review user feedback
- [ ] Update dependencies (if needed)
- [ ] Review access logs
- [ ] Check SSL certificate expiry

### Monthly Tasks

- [ ] Database maintenance (VACUUM, ANALYZE)
- [ ] Review and optimize indexes
- [ ] Security audit
- [ ] Performance review
- [ ] Capacity planning review
- [ ] Update documentation
- [ ] Review and test disaster recovery

### Quarterly Tasks

- [ ] Full security audit
- [ ] Disaster recovery drill
- [ ] Review and update runbooks
- [ ] Performance benchmarking
- [ ] Cost optimization review
- [ ] Update dependencies (major versions)

## Scaling Operations

### Vertical Scaling (Increase Resources)

**When:** CPU/Memory consistently > 80%

**Steps:**

1. **Vercel:**
   - Upgrade to higher tier plan
   - Increase function memory in `vercel.json`

2. **Docker:**
   ```yaml
   # docker-compose.yml
   services:
     app:
       deploy:
         resources:
           limits:
             cpus: '2'
             memory: 4G
   ```

3. **Database:**
   - Upgrade to larger instance
   - Increase connection pool size

### Horizontal Scaling (Add Instances)

**When:** Request rate consistently high

**Steps:**

1. **Vercel:**
   - Automatic scaling included
   - Monitor function concurrency

2. **Docker with Load Balancer:**
   ```yaml
   # docker-compose.yml
   services:
     app:
       deploy:
         replicas: 3
   ```

3. **Database Read Replicas:**
   - Set up read replicas
   - Route read queries to replicas
   - Keep writes on primary

## Security Procedures

### Security Incident Response

**When:** Suspected breach, unauthorized access, data leak

**Steps:**

1. **Immediate:**
   - [ ] Isolate affected systems
   - [ ] Preserve logs
   - [ ] Notify security team
   - [ ] Start incident log

2. **Investigation:**
   - [ ] Review audit logs
   - [ ] Identify entry point
   - [ ] Assess data exposure
   - [ ] Document findings

3. **Containment:**
   - [ ] Revoke compromised credentials
   - [ ] Block malicious IPs
   - [ ] Patch vulnerabilities
   - [ ] Reset affected user passwords

4. **Recovery:**
   - [ ] Restore from clean backup
   - [ ] Verify system integrity
   - [ ] Monitor for reinfection

5. **Notification:**
   - [ ] Notify affected users
   - [ ] Report to authorities (if required)
   - [ ] Update security policies

### Rotate Secrets

**When:** Quarterly, after security incident, employee departure

**Steps:**

1. **Generate new secrets:**
   ```bash
   # New NEXTAUTH_SECRET
   openssl rand -base64 32
   
   # New ENCRYPTION_KEY
   openssl rand -base64 32
   ```

2. **Update environment variables:**
   ```bash
   vercel env add NEXTAUTH_SECRET production
   vercel env add ENCRYPTION_KEY production
   ```

3. **Deploy with new secrets:**
   ```bash
   vercel --prod
   ```

4. **Verify application works:**
   ```bash
   curl https://your-domain.com/health
   ```

5. **Update documentation:**
   - Update secret storage
   - Document rotation date

## Backup and Recovery

### Backup Strategy

**Automated Backups:**
- **Frequency:** Daily at 2 AM
- **Retention:** 30 days
- **Location:** S3 bucket with versioning
- **Encryption:** AES-256

**Manual Backups:**
- Before major deployments
- Before database migrations
- Before bulk data operations

### Disaster Recovery

**Recovery Time Objective (RTO):** 4 hours
**Recovery Point Objective (RPO):** 24 hours

**Steps:**

1. **Assess situation:**
   - [ ] Determine extent of disaster
   - [ ] Identify what needs recovery
   - [ ] Estimate recovery time

2. **Notify stakeholders:**
   - [ ] Post status update
   - [ ] Notify management
   - [ ] Set expectations

3. **Recover infrastructure:**
   - [ ] Provision new servers (if needed)
   - [ ] Restore database from backup
   - [ ] Deploy application

4. **Verify recovery:**
   - [ ] Test all critical functions
   - [ ] Verify data integrity
   - [ ] Check integrations

5. **Resume operations:**
   - [ ] Notify users
   - [ ] Monitor closely
   - [ ] Document lessons learned

### Test Recovery Procedure

**When:** Quarterly

**Steps:**

1. **Set up test environment:**
   ```bash
   # Create test database
   createdb test_recovery_db
   ```

2. **Restore latest backup:**
   ```bash
   # Download backup
   aws s3 cp s3://backups/latest.sql.gz .
   
   # Restore
   gunzip latest.sql.gz
   psql test_recovery_db < latest.sql
   ```

3. **Deploy application:**
   ```bash
   # Point to test database
   DATABASE_URL="postgresql://...test_recovery_db" npm start
   ```

4. **Verify functionality:**
   - [ ] Test login
   - [ ] Test CRUD operations
   - [ ] Verify data integrity

5. **Document results:**
   - Time to recover
   - Issues encountered
   - Improvements needed

6. **Clean up:**
   ```bash
   dropdb test_recovery_db
   ```

## Emergency Contacts

**On-Call Engineer:** Check PagerDuty schedule

**Escalation:**
1. On-call engineer (immediate)
2. Team lead (15 minutes)
3. Engineering manager (30 minutes)
4. CTO (1 hour)

**External Support:**
- Vercel Support: support@vercel.com
- Database Provider: [contact]
- Security Team: security@your-company.com

## Useful Commands Reference

```bash
# Health check
curl https://your-domain.com/health | jq

# View logs
vercel logs --follow

# Database backup
pg_dump $DATABASE_URL > backup.sql

# Database restore
psql $DATABASE_URL < backup.sql

# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size('production_db'));"

# Check Redis
redis-cli -u $REDIS_URL ping

# Clear Redis cache
redis-cli -u $REDIS_URL FLUSHALL

# Check disk space
df -h

# Check memory
free -h

# Check processes
ps aux | grep node

# Restart application
pm2 restart all

# View environment variables
vercel env ls
```
