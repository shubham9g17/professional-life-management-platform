/**
 * Correlation ID Management
 * 
 * Manages correlation IDs for request tracking across the application
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from './logger';

/**
 * Correlation ID header name
 */
export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Storage for correlation ID in async context
 */
class CorrelationContext {
  private storage = new Map<string, string>();

  /**
   * Set correlation ID for current context
   */
  set(id: string): void {
    this.storage.set('current', id);
    logger.setCorrelationId(id);
  }

  /**
   * Get correlation ID for current context
   */
  get(): string | undefined {
    return this.storage.get('current');
  }

  /**
   * Generate and set new correlation ID
   */
  generate(): string {
    const id = uuidv4();
    this.set(id);
    return id;
  }

  /**
   * Clear correlation ID
   */
  clear(): void {
    this.storage.delete('current');
  }
}

/**
 * Global correlation context
 */
export const correlationContext = new CorrelationContext();

/**
 * Get or create correlation ID from request
 */
export function getOrCreateCorrelationId(request: Request): string {
  const existingId = request.headers.get(CORRELATION_ID_HEADER);
  
  if (existingId) {
    correlationContext.set(existingId);
    return existingId;
  }

  return correlationContext.generate();
}

/**
 * Add correlation ID to response headers
 */
export function addCorrelationIdToResponse(
  response: Response,
  correlationId: string
): Response {
  const headers = new Headers(response.headers);
  headers.set(CORRELATION_ID_HEADER, correlationId);
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Middleware to handle correlation IDs
 */
export function withCorrelationId<T>(
  handler: (correlationId: string) => Promise<T>
): Promise<T> {
  const correlationId = correlationContext.get() || correlationContext.generate();
  return handler(correlationId);
}
