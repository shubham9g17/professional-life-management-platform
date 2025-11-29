/**
 * Retry Logic with Exponential Backoff
 * 
 * Implements retry strategies for transient failures with configurable
 * backoff and jitter.
 */

import { logger } from '../logging/logger';
import { NetworkError, ExternalServiceError } from './types';

/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  retryableErrors?: Array<new (...args: any[]) => Error>;
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: true,
  retryableErrors: [NetworkError, ExternalServiceError],
  onRetry: () => {},
};

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number,
  jitter: boolean
): number {
  const exponentialDelay = Math.min(
    initialDelay * Math.pow(multiplier, attempt),
    maxDelay
  );

  if (!jitter) {
    return exponentialDelay;
  }

  // Add jitter: random value between 0 and exponentialDelay
  return Math.random() * exponentialDelay;
}

/**
 * Check if error is retryable
 */
function isRetryableError(
  error: Error,
  retryableErrors: Array<new (...args: any[]) => Error>
): boolean {
  return retryableErrors.some(ErrorClass => error instanceof ErrorClass);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if this is the last attempt
      if (attempt === config.maxRetries) {
        logger.error('Max retries reached', {
          attempts: attempt + 1,
          error: lastError.message,
        });
        throw lastError;
      }

      // Don't retry if error is not retryable
      if (!isRetryableError(lastError, config.retryableErrors)) {
        logger.warn('Non-retryable error encountered', {
          error: lastError.message,
          errorType: lastError.constructor.name,
        });
        throw lastError;
      }

      // Calculate delay and wait
      const delay = calculateDelay(
        attempt,
        config.initialDelayMs,
        config.maxDelayMs,
        config.backoffMultiplier,
        config.jitter
      );

      logger.info('Retrying operation', {
        attempt: attempt + 1,
        maxRetries: config.maxRetries,
        delayMs: Math.round(delay),
        error: lastError.message,
      });

      // Call retry callback
      config.onRetry(lastError, attempt + 1);

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError!;
}

/**
 * Retry configuration for database operations
 */
export const DATABASE_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  jitter: true,
};

/**
 * Retry configuration for external API calls
 */
export const API_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitter: true,
};

/**
 * Retry configuration for network operations
 */
export const NETWORK_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 5,
  initialDelayMs: 2000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: true,
};

/**
 * Create a retryable version of a function
 */
export function retryable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    return withRetry(() => fn(...args), options);
  }) as T;
}
