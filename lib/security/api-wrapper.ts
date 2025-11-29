/**
 * Secure API Route Wrapper
 * Applies rate limiting, input validation, and security headers to API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { applyRateLimit, getRateLimitConfigForRequest } from './rate-limit-middleware';
import { applySecurityHeaders } from './headers';
import { validatePrismaInput } from './validation';
import { AuthenticationError, handleApiError } from '@/lib/error';
import { getOrCreateCorrelationId } from '@/lib/logging/correlation';
import { logger } from '@/lib/logging/logger';

export interface SecureApiOptions {
  requireAuth?: boolean;
  rateLimit?: boolean;
  validateInput?: boolean;
}

/**
 * Wrap an API route handler with security measures
 */
export function secureApiRoute(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: SecureApiOptions = {}
) {
  const {
    requireAuth = true,
    rateLimit = true,
    validateInput = true,
  } = options;

  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const correlationId = getOrCreateCorrelationId(request);
    
    try {
      // Apply rate limiting
      if (rateLimit) {
        const rateLimitConfig = getRateLimitConfigForRequest(request);
        const rateLimitResult = applyRateLimit(request, rateLimitConfig);
        
        if (!rateLimitResult.allowed) {
          logger.warn('Rate limit exceeded', {
            path: request.nextUrl.pathname,
            method: request.method,
            correlationId,
          });
          return rateLimitResult.response!;
        }
      }

      // Check authentication
      if (requireAuth) {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.id) {
          logger.warn('Unauthorized API access attempt', {
            path: request.nextUrl.pathname,
            method: request.method,
            correlationId,
          });
          throw new AuthenticationError();
        }
      }

      // Validate input for write operations
      if (validateInput && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const body = await request.clone().json();
          
          if (!validatePrismaInput(body)) {
            logger.warn('Potentially malicious input detected', {
              path: request.nextUrl.pathname,
              method: request.method,
              correlationId,
            });
            return NextResponse.json(
              { error: 'Invalid input detected' },
              { status: 400 }
            );
          }
        } catch (error) {
          // If body parsing fails, let the handler deal with it
        }
      }

      // Call the actual handler
      const response = await handler(request, context);

      // Apply security headers
      return applySecurityHeaders(response);
    } catch (error) {
      const errorResponse = handleApiError(error, correlationId);
      return applySecurityHeaders(errorResponse);
    }
  };
}

/**
 * Create a secure API route with common patterns
 */
export function createSecureApiRoute(handlers: {
  GET?: (request: NextRequest, context?: any) => Promise<NextResponse>;
  POST?: (request: NextRequest, context?: any) => Promise<NextResponse>;
  PUT?: (request: NextRequest, context?: any) => Promise<NextResponse>;
  PATCH?: (request: NextRequest, context?: any) => Promise<NextResponse>;
  DELETE?: (request: NextRequest, context?: any) => Promise<NextResponse>;
}, options: SecureApiOptions = {}) {
  const secureHandlers: any = {};

  if (handlers.GET) {
    secureHandlers.GET = secureApiRoute(handlers.GET, options);
  }
  if (handlers.POST) {
    secureHandlers.POST = secureApiRoute(handlers.POST, options);
  }
  if (handlers.PUT) {
    secureHandlers.PUT = secureApiRoute(handlers.PUT, options);
  }
  if (handlers.PATCH) {
    secureHandlers.PATCH = secureApiRoute(handlers.PATCH, options);
  }
  if (handlers.DELETE) {
    secureHandlers.DELETE = secureApiRoute(handlers.DELETE, options);
  }

  return secureHandlers;
}
