/**
 * Performance Monitoring and Logging
 * 
 * Tracks and logs slow operations, database queries, and API calls
 */

import { logger } from './logger';
import { PerformanceLogEntry } from './types';

/**
 * Performance thresholds (in milliseconds)
 */
const PERFORMANCE_THRESHOLDS = {
  DATABASE_QUERY: 100,
  API_CALL: 200,
  RENDER: 50,
  GENERAL: 1000,
};

/**
 * Performance monitor class
 */
class PerformanceMonitor {
  private timers: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  start(operationId: string): void {
    this.timers.set(operationId, performance.now());
  }

  /**
   * End timing and log if slow
   */
  end(
    operationId: string,
    operationName: string,
    threshold: number = PERFORMANCE_THRESHOLDS.GENERAL,
    metadata?: Record<string, any>
  ): number {
    const startTime = this.timers.get(operationId);
    
    if (!startTime) {
      logger.warn('Performance timer not found', { operationId, operationName });
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(operationId);

    // Log if operation exceeded threshold
    if (duration > threshold) {
      logger.warn('Slow operation detected', {
        operation: operationName,
        durationMs: Math.round(duration),
        thresholdMs: threshold,
        ...metadata,
      });
    } else {
      logger.debug('Operation completed', {
        operation: operationName,
        durationMs: Math.round(duration),
        ...metadata,
      });
    }

    return duration;
  }

  /**
   * Measure and log an async operation
   */
  async measure<T>(
    operationName: string,
    fn: () => Promise<T>,
    threshold?: number,
    metadata?: Record<string, any>
  ): Promise<T> {
    const operationId = `${operationName}-${Date.now()}`;
    this.start(operationId);

    try {
      const result = await fn();
      this.end(operationId, operationName, threshold, metadata);
      return result;
    } catch (error) {
      this.end(operationId, operationName, threshold, {
        ...metadata,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Measure and log a synchronous operation
   */
  measureSync<T>(
    operationName: string,
    fn: () => T,
    threshold?: number,
    metadata?: Record<string, any>
  ): T {
    const operationId = `${operationName}-${Date.now()}`;
    this.start(operationId);

    try {
      const result = fn();
      this.end(operationId, operationName, threshold, metadata);
      return result;
    } catch (error) {
      this.end(operationId, operationName, threshold, {
        ...metadata,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for measuring async function performance
 */
export function measurePerformance(
  operationName?: string,
  threshold?: number
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const name = operationName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measure(
        name,
        () => originalMethod.apply(this, args),
        threshold
      );
    };

    return descriptor;
  };
}

/**
 * Log database query performance
 */
export function logDatabaseQuery(
  query: string,
  durationMs: number,
  metadata?: Record<string, any>
): void {
  const threshold = PERFORMANCE_THRESHOLDS.DATABASE_QUERY;

  if (durationMs > threshold) {
    logger.warn('Slow database query', {
      query: query.substring(0, 200), // Truncate long queries
      durationMs: Math.round(durationMs),
      thresholdMs: threshold,
      ...metadata,
    });
  } else {
    logger.debug('Database query executed', {
      query: query.substring(0, 100),
      durationMs: Math.round(durationMs),
      ...metadata,
    });
  }
}

/**
 * Create a performance logging wrapper for Prisma
 */
export function createPrismaPerformanceLogger() {
  return {
    log: [
      {
        emit: 'event',
        level: 'query',
      },
    ],
    events: {
      query: (e: any) => {
        logDatabaseQuery(e.query, e.duration, {
          params: e.params,
          target: e.target,
        });
      },
    },
  };
}
