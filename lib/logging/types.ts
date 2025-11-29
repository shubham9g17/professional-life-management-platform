/**
 * Logging Types and Interfaces
 * 
 * Defines types for structured logging with correlation IDs and metadata
 */

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  correlationId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  stack?: string;
  context?: {
    service?: string;
    environment?: string;
    version?: string;
  };
}

/**
 * Logger interface
 */
export interface ILogger {
  debug(message: string, metadata?: Record<string, any>): void;
  info(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, metadata?: Record<string, any>): void;
  critical(message: string, metadata?: Record<string, any>): void;
  setCorrelationId(id: string): void;
  setUserId(id: string): void;
}

/**
 * Performance log entry
 */
export interface PerformanceLogEntry {
  operation: string;
  durationMs: number;
  timestamp: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

/**
 * Audit log entry for user actions
 */
export interface AuditLogEntry {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}
