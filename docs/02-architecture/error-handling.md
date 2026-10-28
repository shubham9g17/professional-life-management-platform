# Error Handling and Logging System

This document describes the comprehensive error handling and logging system implemented in the Professional Life Management Platform.

## Overview

The system provides:
- **Structured error types** with proper categorization
- **Global error handling** for uncaught errors
- **Error boundaries** for React component errors
- **Retry logic** with exponential backoff
- **Structured logging** with correlation IDs
- **Performance monitoring** for slow operations
- **Audit logging** for compliance and security

## Error Handling

### Error Types

All errors extend from `AppError` base class with the following properties:
- `statusCode`: HTTP status code
- `category`: Error category (VALIDATION, AUTHENTICATION, etc.)
- `severity`: Error severity (LOW, MEDIUM, HIGH, CRITICAL)
- `isOperational`: Whether error is expected/operational
- `timestamp`: When error occurred
- `correlationId`: Request tracking ID
- `metadata`: Additional error context

### Available Error Classes

```typescript
import {
  ValidationError,      // 400 - Invalid input
  AuthenticationError,  // 401 - Auth required
  AuthorizationError,   // 403 - Insufficient permissions
  NotFoundError,        // 404 - Resource not found
  ConflictError,        // 409 - Data conflict
  RateLimitError,       // 429 - Too many requests
  DatabaseError,        // 500 - Database operation failed
  NetworkError,         // 503 - Network error
  ExternalServiceError, // 502 - External service failed
  InternalError,        // 500 - Internal server error
} from '@/lib/error';
```

### Usage in API Routes

```typescript
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/error';
import { getOrCreateCorrelationId } from '@/lib/logging/correlation';

export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  
  try {
    // Check authentication
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    // Validate input
    if (!isValid(data)) {
      throw new ValidationError('Invalid data', { field: 'email' });
    }

    // Your logic here
    
  } catch (error) {
    return handleApiError(error, correlationId);
  }
}
```

### Error Response Format

All API errors return a consistent format:

```json
{
  "error": {
    "message": "User-friendly error message",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "category": "VALIDATION",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "correlationId": "uuid-here",
    "details": {
      "field": "email"
    }
  }
}
```

## Error Boundaries

### React Error Boundaries

Wrap components with error boundaries to catch rendering errors:

```typescript
import { ErrorBoundary } from '@/components/error/error-boundary';

function MyPage() {
  return (
    <ErrorBoundary
      fallback={<CustomErrorUI />}
      onError={(error, errorInfo) => {
        // Custom error handling
      }}
    >
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### Higher-Order Component

```typescript
import { withErrorBoundary } from '@/components/error/error-boundary';

const SafeComponent = withErrorBoundary(MyComponent, {
  fallback: <ErrorFallback />,
});
```

### Global Error Handler

The `app/global-error.tsx` catches all unhandled errors at the root level.

## Retry Logic

### Automatic Retry with Exponential Backoff

```typescript
import { withRetry, API_RETRY_OPTIONS } from '@/lib/error/retry';

// Retry a function
const result = await withRetry(
  async () => {
    return await fetchExternalAPI();
  },
  API_RETRY_OPTIONS
);

// Create retryable function
const retryableFetch = retryable(fetchExternalAPI, {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitter: true,
});
```

### Retry Options

```typescript
interface RetryOptions {
  maxRetries?: number;           // Default: 3
  initialDelayMs?: number;       // Default: 1000
  maxDelayMs?: number;           // Default: 30000
  backoffMultiplier?: number;    // Default: 2
  jitter?: boolean;              // Default: true
  retryableErrors?: ErrorClass[];
  onRetry?: (error, attempt) => void;
}
```

### Predefined Retry Configurations

- `DATABASE_RETRY_OPTIONS`: For database operations
- `API_RETRY_OPTIONS`: For external API calls
- `NETWORK_RETRY_OPTIONS`: For network operations

## Logging System

### Structured Logging

```typescript
import { logger } from '@/lib/logging/logger';

// Log levels
logger.debug('Debug message', { data: 'value' });
logger.info('Info message', { userId: '123' });
logger.warn('Warning message', { threshold: 100 });
logger.error('Error message', { error: err.message, stack: err.stack });
logger.critical('Critical error', { system: 'database' });
```

### Log Entry Format

```json
{
  "level": "INFO",
  "message": "User logged in",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "correlationId": "uuid-here",
  "userId": "user-123",
  "metadata": {
    "ipAddress": "192.168.1.1"
  },
  "context": {
    "service": "professional-life-platform",
    "environment": "production",
    "version": "1.0.0"
  }
}
```

### Correlation IDs

Correlation IDs track requests across the system:

```typescript
import { getOrCreateCorrelationId } from '@/lib/logging/correlation';

export async function GET(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  
  logger.info('Processing request', { correlationId });
  
  // Correlation ID is automatically included in all logs
}
```

### Performance Monitoring

Track slow operations:

```typescript
import { performanceMonitor, measurePerformance } from '@/lib/logging/performance';

// Measure async operation
const result = await performanceMonitor.measure(
  'fetchUserData',
  async () => {
    return await fetchData();
  },
  100 // threshold in ms
);

// Measure sync operation
const result = performanceMonitor.measureSync(
  'calculateScore',
  () => {
    return calculate();
  }
);

// Decorator for class methods
class MyService {
  @measurePerformance('myOperation', 200)
  async myOperation() {
    // Your code
  }
}
```

### Database Query Logging

Log slow database queries:

```typescript
import { logDatabaseQuery } from '@/lib/logging/performance';

const startTime = performance.now();
const result = await prisma.user.findMany();
const duration = performance.now() - startTime;

logDatabaseQuery('SELECT * FROM users', duration, {
  resultCount: result.length,
});
```

### Audit Logging

Track user actions for compliance:

```typescript
import { auditLogger, AuditAction, AuditResource } from '@/lib/logging/audit';

// Log authentication
await auditLogger.logAuth(
  userId,
  AuditAction.LOGIN,
  true,
  {
    ipAddress: request.headers.get('x-forwarded-for'),
    userAgent: request.headers.get('user-agent'),
  }
);

// Log data access
await auditLogger.logDataAccess(
  userId,
  AuditAction.CREATE,
  AuditResource.TASK,
  taskId,
  { workspace: 'PROFESSIONAL' }
);

// Log sensitive operation
await auditLogger.logSensitiveOperation(
  userId,
  AuditAction.DELETE_ACCOUNT,
  { reason: 'User requested' }
);
```

## Best Practices

### 1. Always Use Correlation IDs

```typescript
export async function POST(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  // Use correlationId throughout the request
}
```

### 2. Use Appropriate Error Types

```typescript
// Good
throw new ValidationError('Email is required', { field: 'email' });

// Bad
throw new Error('Email is required');
```

### 3. Log at Appropriate Levels

- `DEBUG`: Detailed information for debugging
- `INFO`: General informational messages
- `WARN`: Warning messages for potential issues
- `ERROR`: Error messages for failures
- `CRITICAL`: Critical errors requiring immediate attention

### 4. Include Context in Logs

```typescript
// Good
logger.info('Task created', {
  userId: session.user.id,
  taskId: task.id,
  workspace: task.workspace,
});

// Bad
logger.info('Task created');
```

### 5. Audit Sensitive Operations

Always audit:
- Authentication events
- Data modifications
- Permission changes
- Data exports
- Account deletions

### 6. Use Retry Logic for Transient Failures

```typescript
// Good - Retry network calls
const data = await withRetry(
  () => fetchExternalAPI(),
  API_RETRY_OPTIONS
);

// Bad - No retry for transient failures
const data = await fetchExternalAPI();
```

### 7. Wrap Components in Error Boundaries

```typescript
// Good
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>

// Bad - No error boundary
<MyComponent />
```

## Configuration

### Environment Variables

```env
# Logging
LOG_LEVEL=INFO                    # Minimum log level
ENABLE_CONSOLE_LOGGING=true       # Console output
ENABLE_FILE_LOGGING=false         # File output
PRETTY_PRINT_LOGS=false           # Pretty print (dev only)

# Error Handling
NODE_ENV=production               # Environment
APP_VERSION=1.0.0                 # App version
```

### Custom Logger Configuration

```typescript
import { createLogger } from '@/lib/logging/logger';

const customLogger = createLogger({
  minLevel: LogLevel.WARN,
  enableConsole: true,
  enableFile: true,
  prettyPrint: false,
  service: 'my-service',
});
```

## Testing

### Testing Error Handling

```typescript
import { ValidationError } from '@/lib/error';

test('should throw validation error', () => {
  expect(() => {
    validateInput(invalidData);
  }).toThrow(ValidationError);
});
```

### Testing Retry Logic

```typescript
import { withRetry } from '@/lib/error/retry';

test('should retry on failure', async () => {
  let attempts = 0;
  
  await withRetry(
    async () => {
      attempts++;
      if (attempts < 3) throw new NetworkError();
      return 'success';
    },
    { maxRetries: 3 }
  );
  
  expect(attempts).toBe(3);
});
```

## Monitoring

### Key Metrics to Monitor

1. **Error Rate**: Track error frequency by type
2. **Response Times**: Monitor slow operations
3. **Retry Success Rate**: Track retry effectiveness
4. **Critical Errors**: Alert on critical errors
5. **Audit Trail**: Review security-sensitive operations

### Log Analysis

Use correlation IDs to trace requests:

```bash
# Find all logs for a request
grep "correlation-id-here" logs/*.log

# Find all errors
grep "ERROR" logs/*.log

# Find slow operations
grep "Slow operation" logs/*.log
```

## Future Enhancements

- [ ] Integration with external logging services (Datadog, Sentry)
- [ ] Log aggregation and analysis dashboard
- [ ] Automated alerting for critical errors
- [ ] Performance regression detection
- [ ] Advanced audit log querying
