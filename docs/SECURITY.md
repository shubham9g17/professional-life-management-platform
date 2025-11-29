# Security Implementation Guide

This document describes the security measures implemented in the Professional Life Management Platform.

## Table of Contents

1. [Security Headers](#security-headers)
2. [Rate Limiting](#rate-limiting)
3. [Input Validation & Sanitization](#input-validation--sanitization)
4. [XSS Protection](#xss-protection)
5. [Data Encryption](#data-encryption)
6. [Row-Level Security](#row-level-security)
7. [GDPR Compliance](#gdpr-compliance)
8. [Audit Logging](#audit-logging)
9. [Best Practices](#best-practices)

## Security Headers

### Content Security Policy (CSP)

The application implements a strict Content Security Policy to prevent XSS attacks:

```typescript
import { applySecurityHeaders } from '@/lib/security/headers';

// Applied automatically via middleware
const response = NextResponse.next();
applySecurityHeaders(response);
```

**Headers Applied:**
- `Content-Security-Policy`: Restricts resource loading
- `X-Content-Type-Options`: Prevents MIME sniffing
- `X-Frame-Options`: Prevents clickjacking
- `X-XSS-Protection`: Enables browser XSS protection
- `Referrer-Policy`: Controls referrer information
- `Permissions-Policy`: Restricts browser features
- `Strict-Transport-Security`: Forces HTTPS (production only)

### Configuration

Security headers are configured in:
- `lib/security/headers.ts` - Header definitions
- `middleware.ts` - Applied to all routes
- `next.config.ts` - Backup headers

## Rate Limiting

### Implementation

Rate limiting protects against brute force attacks and API abuse:

```typescript
import { applyRateLimit, rateLimitConfigs } from '@/lib/security/rate-limit-middleware';

// Apply rate limiting to API routes
const rateLimitResult = applyRateLimit(request, rateLimitConfigs.auth);
if (!rateLimitResult.allowed) {
  return rateLimitResult.response;
}
```

### Rate Limit Configurations

| Endpoint Type | Max Attempts | Window |
|--------------|--------------|--------|
| Authentication | 5 | 15 minutes |
| Write Operations | 30 | 1 minute |
| Read Operations | 100 | 1 minute |
| Export Operations | 5 | 1 hour |
| Default | 60 | 1 minute |

### Rate Limit Headers

Responses include rate limit information:
- `X-RateLimit-Limit`: Maximum attempts allowed
- `X-RateLimit-Remaining`: Remaining attempts
- `X-RateLimit-Reset`: Timestamp when limit resets
- `Retry-After`: Seconds until retry (when limited)

## Input Validation & Sanitization

### Validation

All input is validated using Zod schemas:

```typescript
import { validateRequestBody, commonSchemas } from '@/lib/security/validation';

const schema = z.object({
  email: commonSchemas.email,
  name: commonSchemas.name,
  description: commonSchemas.description,
});

const result = validateRequestBody(body, schema);
if (!result.success) {
  return NextResponse.json({ error: result.error }, { status: 400 });
}
```

### Sanitization

Input is automatically sanitized:

```typescript
import { sanitizeHtml, sanitizeText, sanitizeEmail } from '@/lib/security/validation';

const cleanHtml = sanitizeHtml(userInput);
const cleanText = sanitizeText(userInput);
const cleanEmail = sanitizeEmail(email);
```

### SQL Injection Prevention

Prisma provides parameterized queries, but we add an extra layer:

```typescript
import { validatePrismaInput } from '@/lib/security/validation';

if (!validatePrismaInput(queryParams)) {
  throw new Error('Invalid input detected');
}
```

## XSS Protection

### HTML Escaping

```typescript
import { escapeHtml, sanitizeUserContent } from '@/lib/security/xss-protection';

// Escape HTML special characters
const safe = escapeHtml(userInput);

// Sanitize user-generated content
const sanitized = sanitizeUserContent(richTextContent);
```

### XSS Detection

```typescript
import { containsXss, validateContent } from '@/lib/security/xss-protection';

if (containsXss(input)) {
  throw new Error('Potentially malicious content detected');
}

const validation = validateContent(input);
if (!validation.safe) {
  console.warn('XSS attempts detected:', validation.warnings);
}
```

### Safe URL Handling

```typescript
import { safeUrl } from '@/lib/security/xss-protection';

const cleanUrl = safeUrl(userProvidedUrl);
// Only allows http:, https:, mailto:, tel: protocols
```

## Data Encryption

### Encrypting Sensitive Data

```typescript
import { encrypt, decrypt, encryptFields } from '@/lib/security/encryption';

// Encrypt a single value
const encrypted = encrypt(sensitiveData);
const decrypted = decrypt(encrypted);

// Encrypt specific fields in an object
const user = {
  name: 'John',
  ssn: '123-45-6789',
  email: 'john@example.com',
};
const encrypted = encryptFields(user, ['ssn']);
```

### Token Encryption

OAuth tokens are automatically encrypted:

```typescript
import { encryptToken, decryptToken } from '@/lib/security/encryption';

// Store encrypted token
const encryptedToken = encryptToken(accessToken);
await prisma.integration.create({
  data: {
    accessToken: encryptedToken,
    // ...
  },
});

// Retrieve and decrypt
const integration = await prisma.integration.findUnique({ where: { id } });
const accessToken = decryptToken(integration.accessToken);
```

### Configuration

Set the encryption key in `.env`:

```bash
# Generate a secure key
openssl rand -base64 32

# Add to .env
ENCRYPTION_KEY="your-secure-random-key-here"
```

## Row-Level Security

### Automatic User Filtering

All queries automatically filter by user ID:

```typescript
import { addUserFilter } from '@/lib/security/row-level-security';

// Automatically adds userId to where clause
const tasks = await prisma.task.findMany({
  where: addUserFilter(userId, { status: 'TODO' }),
});
```

### Resource Ownership Validation

```typescript
import { validateResourceOwnership } from '@/lib/security/row-level-security';

const isOwner = await validateResourceOwnership(
  prisma,
  'task',
  taskId,
  userId
);

if (!isOwner) {
  throw new Error('Unauthorized');
}
```

### Secure Prisma Client

```typescript
import { createSecurePrismaClient } from '@/lib/security/row-level-security';

// Creates a proxy that automatically filters by userId
const securePrisma = createSecurePrismaClient(prisma, userId);

// All queries automatically filtered
const tasks = await securePrisma.task.findMany();
// Only returns tasks belonging to userId
```

## GDPR Compliance

### Data Export (Right to Data Portability)

Users can export all their data:

```typescript
// API: GET /api/user/export
import { exportUserData } from '@/lib/security/gdpr-compliance';

const exportData = await exportUserData(userId);
// Returns JSON with all user data
```

**Export includes:**
- User profile and preferences
- All tasks, habits, transactions
- Health and fitness data
- Learning resources
- Analytics and achievements
- Integration configurations (excluding tokens)

### Data Deletion (Right to Erasure)

Users can delete all their data:

```typescript
// API: DELETE /api/user/delete
import { deleteUserData } from '@/lib/security/gdpr-compliance';

await deleteUserData(userId);
// Permanently deletes all user data
```

**Deletion process:**
1. Deletes all related records (cascading)
2. Removes user account
3. Logs deletion in audit trail
4. Cannot be undone

### Data Anonymization

Alternative to deletion for analytics:

```typescript
import { anonymizeUserData } from '@/lib/security/gdpr-compliance';

await anonymizeUserData(userId);
// Removes PII but keeps anonymized data
```

### Data Retention Information

```typescript
// API: GET /api/user/data-retention
import { getDataRetentionInfo } from '@/lib/security/gdpr-compliance';

const info = await getDataRetentionInfo(userId);
// Returns information about stored data
```

## Audit Logging

All sensitive operations are logged:

```typescript
import { auditLogger, AuditAction, AuditResource } from '@/lib/logging/audit';

await auditLogger.logDataAccess(
  userId,
  AuditAction.READ,
  AuditResource.USER,
  resourceId,
  { action: 'GDPR_DATA_EXPORT' }
);
```

**Logged actions:**
- Data exports
- Data deletions
- Authentication attempts
- Resource access
- Configuration changes

## Best Practices

### For Developers

1. **Always validate input:**
   ```typescript
   const result = validateRequestBody(body, schema);
   if (!result.success) {
     return error response;
   }
   ```

2. **Use secure API wrapper:**
   ```typescript
   import { secureApiRoute } from '@/lib/security/api-wrapper';
   
   export const GET = secureApiRoute(async (request) => {
     // Your handler code
   });
   ```

3. **Encrypt sensitive data:**
   ```typescript
   const encrypted = encrypt(sensitiveValue);
   ```

4. **Validate resource ownership:**
   ```typescript
   const isOwner = await validateResourceOwnership(prisma, model, id, userId);
   ```

5. **Sanitize user content:**
   ```typescript
   const clean = sanitizeUserContent(userInput);
   ```

### For Deployment

1. **Set strong encryption key:**
   ```bash
   ENCRYPTION_KEY=$(openssl rand -base64 32)
   ```

2. **Enable HTTPS:**
   - HSTS headers only apply in production
   - Use SSL/TLS certificates

3. **Configure CSP:**
   - Review and tighten CSP directives
   - Remove 'unsafe-inline' and 'unsafe-eval' if possible

4. **Monitor rate limits:**
   - Adjust limits based on usage patterns
   - Consider Redis for distributed rate limiting

5. **Regular security audits:**
   - Review audit logs
   - Check for suspicious activity
   - Update dependencies

### Security Checklist

- [ ] HTTPS enabled in production
- [ ] Strong encryption key set
- [ ] Rate limiting configured
- [ ] CSP headers applied
- [ ] Input validation on all endpoints
- [ ] Sensitive data encrypted
- [ ] Row-level security enforced
- [ ] Audit logging enabled
- [ ] GDPR endpoints tested
- [ ] Security headers verified
- [ ] Dependencies updated
- [ ] Penetration testing completed

## Security Incident Response

If a security incident is detected:

1. **Immediate Actions:**
   - Isolate affected systems
   - Preserve logs and evidence
   - Notify security team

2. **Investigation:**
   - Review audit logs
   - Identify scope of breach
   - Determine root cause

3. **Remediation:**
   - Patch vulnerabilities
   - Reset compromised credentials
   - Update security measures

4. **Notification:**
   - Notify affected users (GDPR requirement)
   - Report to authorities if required
   - Document incident

## Contact

For security concerns or to report vulnerabilities:
- Email: security@example.com
- Use responsible disclosure practices
- Allow 90 days for remediation before public disclosure

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GDPR Compliance](https://gdpr.eu/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
