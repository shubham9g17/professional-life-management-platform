# Production Deployment Checklist

Use this checklist before deploying to production to ensure all requirements are met.

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing (`npm test`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code coverage > 80% for critical paths
- [ ] All property-based tests passing
- [ ] Code reviewed and approved by at least one team member
- [ ] No console.log statements in production code
- [ ] No TODO comments for critical functionality

### Security

- [ ] All secrets stored in environment variables (not in code)
- [ ] NEXTAUTH_SECRET is unique and secure (32+ characters)
- [ ] ENCRYPTION_KEY is unique and secure (32+ characters)
- [ ] Database uses SSL/TLS connections (`sslmode=require`)
- [ ] Rate limiting configured on all API endpoints
- [ ] CORS properly configured
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] Input validation on all user inputs
- [ ] SQL injection prevention verified (using Prisma parameterized queries)
- [ ] XSS protection enabled
- [ ] CSRF protection enabled
- [ ] Authentication system tested
- [ ] Authorization checks on all protected routes
- [ ] Sensitive data encrypted at rest
- [ ] Audit logging enabled

### Database

- [ ] Database migrations tested in staging
- [ ] Backup created before migration
- [ ] Rollback migration prepared
- [ ] Database indexes optimized
- [ ] Connection pooling configured
- [ ] Database credentials secured
- [ ] Database accessible from application servers
- [ ] Database firewall rules configured
- [ ] Automated backups configured (daily)
- [ ] Backup retention policy set (30 days)
- [ ] Backup restoration tested

### Environment Configuration

- [ ] `.env.production` created from `.env.production.example`
- [ ] All required environment variables set:
  - [ ] `DATABASE_URL`
  - [ ] `NEXTAUTH_URL`
  - [ ] `NEXTAUTH_SECRET`
  - [ ] `REDIS_URL`
  - [ ] `ENCRYPTION_KEY`
  - [ ] `CRON_SECRET` (optional)
  - [ ] `APM_DSN` (optional)
  - [ ] `ERROR_TRACKING_DSN` (optional)
- [ ] Environment variables set in hosting platform
- [ ] No `.env` files committed to version control
- [ ] `.gitignore` includes `.env*` files

### Infrastructure

- [ ] PostgreSQL database provisioned
- [ ] Redis cache provisioned
- [ ] CDN configured (if applicable)
- [ ] Domain name configured
- [ ] SSL/TLS certificate installed
- [ ] DNS records configured
- [ ] Firewall rules configured
- [ ] Load balancer configured (if applicable)
- [ ] Auto-scaling configured (if applicable)

### Monitoring & Observability

- [ ] Health check endpoint working (`/health`)
- [ ] Error tracking configured (Sentry or similar)
- [ ] Application performance monitoring configured
- [ ] Uptime monitoring configured (UptimeRobot or similar)
- [ ] Log aggregation configured
- [ ] Alerts configured for critical issues
- [ ] Alert channels tested (email, SMS, Slack)
- [ ] On-call schedule established
- [ ] Monitoring dashboards created
- [ ] Metrics collection enabled

### Performance

- [ ] Build size optimized (< 500KB initial bundle)
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Lazy loading for non-critical components
- [ ] Caching strategy implemented
- [ ] Database queries optimized
- [ ] API response times < 200ms (p95)
- [ ] Page load times < 3 seconds
- [ ] Lighthouse score > 90
- [ ] Web Vitals meet targets:
  - [ ] LCP < 2.5s
  - [ ] FID < 100ms
  - [ ] CLS < 0.1

### Testing

- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Property-based tests passing
- [ ] End-to-end tests passing (critical flows)
- [ ] Load testing completed
- [ ] Security testing completed
- [ ] Accessibility testing completed
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness tested
- [ ] Staging deployment successful

### Documentation

- [ ] README.md updated
- [ ] DEPLOYMENT.md reviewed
- [ ] MONITORING.md reviewed
- [ ] TROUBLESHOOTING.md reviewed
- [ ] RUNBOOK.md reviewed
- [ ] API documentation updated
- [ ] Changelog updated
- [ ] Release notes prepared

### Compliance

- [ ] GDPR compliance verified
- [ ] Data retention policies implemented
- [ ] Data export functionality working
- [ ] Data deletion functionality working
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Cookie consent implemented (if applicable)

### Backup & Recovery

- [ ] Backup strategy documented
- [ ] Automated backups configured
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented
- [ ] RTO and RPO defined
- [ ] Rollback procedure documented

## Deployment Steps

### 1. Pre-Deployment

- [ ] Create deployment tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
- [ ] Push tag: `git push origin v1.0.0`
- [ ] Notify team in #deployments channel
- [ ] Schedule deployment window (if needed)
- [ ] Create database backup

### 2. Database Migration

- [ ] Run migrations in staging first
- [ ] Verify migrations successful in staging
- [ ] Create production database backup
- [ ] Run migrations in production: `npx prisma migrate deploy`
- [ ] Verify migrations successful: `npx prisma migrate status`

### 3. Application Deployment

- [ ] Deploy to production: `vercel --prod` or equivalent
- [ ] Wait for deployment to complete
- [ ] Verify deployment successful

### 4. Post-Deployment Verification

- [ ] Health check passes: `curl https://your-domain.com/health`
- [ ] Version endpoint returns correct version
- [ ] Test critical user flows:
  - [ ] User registration
  - [ ] User login
  - [ ] Task creation
  - [ ] Habit tracking
  - [ ] Financial transaction
  - [ ] Data export
- [ ] Check error tracking dashboard (no new errors)
- [ ] Check monitoring dashboard (metrics normal)
- [ ] Check logs for errors
- [ ] Verify database connections
- [ ] Verify Redis connections
- [ ] Test API endpoints
- [ ] Test frontend functionality

### 5. Monitoring Period

- [ ] Monitor for 15 minutes after deployment
- [ ] Watch error rates
- [ ] Watch response times
- [ ] Watch user activity
- [ ] Check for any anomalies

### 6. Communication

- [ ] Post deployment success in #deployments
- [ ] Update status page (if applicable)
- [ ] Notify stakeholders
- [ ] Update documentation (if needed)

## Post-Deployment Checklist

### Immediate (0-1 hour)

- [ ] All critical functionality working
- [ ] No increase in error rates
- [ ] Response times within acceptable range
- [ ] No user complaints
- [ ] Monitoring shows healthy status

### Short-term (1-24 hours)

- [ ] Monitor error tracking dashboard
- [ ] Review user feedback
- [ ] Check performance metrics
- [ ] Verify cron jobs running
- [ ] Check backup completion

### Medium-term (1-7 days)

- [ ] Review analytics
- [ ] Check for any patterns in errors
- [ ] Monitor resource usage
- [ ] Review user engagement
- [ ] Gather feedback

## Rollback Checklist

If issues are detected, use this rollback checklist:

### Decision Criteria

Rollback if:
- [ ] Error rate > 5%
- [ ] Critical functionality broken
- [ ] Data corruption detected
- [ ] Security vulnerability discovered
- [ ] Performance degradation > 50%
- [ ] Database issues

### Rollback Steps

- [ ] Notify team immediately
- [ ] Stop current deployment
- [ ] Identify last known good version
- [ ] Rollback application: `vercel rollback` or equivalent
- [ ] Rollback database (if needed)
- [ ] Verify rollback successful
- [ ] Test critical functionality
- [ ] Monitor for stability
- [ ] Post rollback notification
- [ ] Document issue for post-mortem

## Emergency Procedures

### Critical Production Issue

1. **Immediate Actions:**
   - [ ] Acknowledge alert
   - [ ] Post in #incidents channel
   - [ ] Page on-call engineer
   - [ ] Start incident log

2. **Assessment:**
   - [ ] Determine severity
   - [ ] Identify affected users
   - [ ] Check recent changes
   - [ ] Review logs

3. **Mitigation:**
   - [ ] Implement fix or rollback
   - [ ] Verify issue resolved
   - [ ] Monitor for stability

4. **Communication:**
   - [ ] Update status page
   - [ ] Notify affected users
   - [ ] Post updates regularly

### Maintenance Mode

If you need to enable maintenance mode:

```bash
# Enable maintenance mode
vercel env add MAINTENANCE_MODE true production
vercel --prod

# Disable maintenance mode
vercel env rm MAINTENANCE_MODE production
vercel --prod
```

## Sign-off

Before deploying to production, ensure sign-off from:

- [ ] **Developer:** Code is ready and tested
- [ ] **Tech Lead:** Architecture and design approved
- [ ] **QA:** All tests passing
- [ ] **DevOps:** Infrastructure ready
- [ ] **Product Owner:** Features approved (if applicable)

**Deployment Date:** _______________

**Deployed By:** _______________

**Version:** _______________

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

## Post-Deployment Review

After deployment, schedule a review meeting to discuss:

- What went well
- What could be improved
- Any issues encountered
- Action items for next deployment

**Review Date:** _______________

**Attendees:** _______________

**Action Items:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

## Resources

- [Deployment Guide](./DEPLOYMENT.md)
- [Monitoring Guide](./MONITORING.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Operations Runbook](./RUNBOOK.md)
- [Security Documentation](./SECURITY.md)

## Version History

| Version | Date | Changes | Deployed By |
|---------|------|---------|-------------|
| 1.0.0   |      | Initial release | |
| 1.0.1   |      | Bug fixes | |
| 1.1.0   |      | New features | |
