/**
 * Rate Limiting Middleware for API Routes
 * Protects against brute force attacks and API abuse
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RateLimitConfig } from '@/lib/rate-limit';

/**
 * Rate limit configurations for different endpoint types
 */
export const rateLimitConfigs = {
  // Authentication endpoints - strict limits
  auth: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  
  // Write operations - moderate limits
  write: {
    maxAttempts: 30,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // Read operations - generous limits
  read: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // Export operations - strict limits (resource intensive)
  export: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  
  // Default for other endpoints
  default: {
    maxAttempts: 60,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const ip = 
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') || // Cloudflare
    request.headers.get('x-client-ip') ||
    'unknown';
  
  return ip;
}

/**
 * Apply rate limiting to a request
 */
export function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig = rateLimitConfigs.default
): { allowed: boolean; response?: NextResponse } {
  const identifier = getClientIdentifier(request);
  const rateLimit = checkRateLimit(identifier, config);
  
  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        resetAt: new Date(rateLimit.resetAt).toISOString(),
      },
      { status: 429 }
    );
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', config.maxAttempts.toString());
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', rateLimit.resetAt.toString());
    response.headers.set('Retry-After', Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString());
    
    return { allowed: false, response };
  }
  
  return { allowed: true };
}

/**
 * Higher-order function to wrap API route handlers with rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config: RateLimitConfig = rateLimitConfigs.default
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const rateLimitResult = applyRateLimit(request, config);
    
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }
    
    const response = await handler(request, ...args);
    
    // Add rate limit headers to successful responses
    const identifier = getClientIdentifier(request);
    const rateLimit = checkRateLimit(identifier, config);
    
    response.headers.set('X-RateLimit-Limit', config.maxAttempts.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimit.resetAt.toString());
    
    return response;
  };
}

/**
 * Determine rate limit config based on request method and path
 */
export function getRateLimitConfigForRequest(request: NextRequest): RateLimitConfig {
  const { pathname } = new URL(request.url);
  const method = request.method;
  
  // Authentication endpoints
  if (pathname.startsWith('/api/auth/')) {
    return rateLimitConfigs.auth;
  }
  
  // Export endpoints
  if (pathname.includes('/export')) {
    return rateLimitConfigs.export;
  }
  
  // Write operations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return rateLimitConfigs.write;
  }
  
  // Read operations
  if (method === 'GET') {
    return rateLimitConfigs.read;
  }
  
  return rateLimitConfigs.default;
}
