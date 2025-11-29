/**
 * Structured Logger Implementation
 * 
 * Provides structured logging with correlation IDs, metadata, and
 * different output formats for development and production.
 */

import { LogLevel, LogEntry, ILogger } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Logger configuration
 */
interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  prettyPrint: boolean;
  service?: string;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableFile: false,
  prettyPrint: process.env.NODE_ENV !== 'production',
  service: 'professional-life-platform',
};

/**
 * Log level priorities for filtering
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.CRITICAL]: 4,
};

/**
 * Structured logger class
 */
class Logger implements ILogger {
  private config: LoggerConfig;
  private correlationId?: string;
  private userId?: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set correlation ID for request tracking
   */
  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  /**
   * Set user ID for user tracking
   */
  setUserId(id: string): void {
    this.userId = id;
  }

  /**
   * Generate correlation ID if not set
   */
  private getCorrelationId(): string {
    if (!this.correlationId) {
      this.correlationId = uuidv4();
    }
    return this.correlationId;
  }

  /**
   * Create log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      correlationId: this.correlationId,
      userId: this.userId,
      metadata,
      context: {
        service: this.config.service,
        environment: process.env.NODE_ENV,
        version: process.env.APP_VERSION,
      },
    };
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.minLevel];
  }

  /**
   * Format log entry for output
   */
  private formatLogEntry(entry: LogEntry): string {
    if (this.config.prettyPrint) {
      return this.formatPretty(entry);
    }
    return JSON.stringify(entry);
  }

  /**
   * Format log entry for pretty printing (development)
   */
  private formatPretty(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const level = entry.level.padEnd(8);
    const correlationId = entry.correlationId ? ` [${entry.correlationId.slice(0, 8)}]` : '';
    const userId = entry.userId ? ` [user:${entry.userId}]` : '';
    
    let output = `${timestamp} ${level}${correlationId}${userId} ${entry.message}`;
    
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      output += `\n  ${JSON.stringify(entry.metadata, null, 2)}`;
    }
    
    if (entry.stack) {
      output += `\n${entry.stack}`;
    }
    
    return output;
  }

  /**
   * Write log entry
   */
  private write(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const formatted = this.formatLogEntry(entry);

    // Console output
    if (this.config.enableConsole) {
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(formatted);
          break;
        case LogLevel.INFO:
          console.info(formatted);
          break;
        case LogLevel.WARN:
          console.warn(formatted);
          break;
        case LogLevel.ERROR:
        case LogLevel.CRITICAL:
          console.error(formatted);
          break;
      }
    }

    // File output (would be implemented with a file writer in production)
    if (this.config.enableFile) {
      // TODO: Implement file logging
      // This would typically write to a log file or send to a logging service
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, metadata);
    this.write(entry);
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, metadata);
    this.write(entry);
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, metadata);
    this.write(entry);
  }

  /**
   * Log error message
   */
  error(message: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, metadata);
    
    // Capture stack trace if available
    if (metadata?.stack) {
      entry.stack = metadata.stack;
    } else {
      entry.stack = new Error().stack;
    }
    
    this.write(entry);
  }

  /**
   * Log critical message
   */
  critical(message: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.CRITICAL, message, metadata);
    
    // Capture stack trace
    if (metadata?.stack) {
      entry.stack = metadata.stack;
    } else {
      entry.stack = new Error().stack;
    }
    
    this.write(entry);
  }

  /**
   * Create child logger with inherited context
   */
  child(metadata: Record<string, any>): Logger {
    const childLogger = new Logger(this.config);
    childLogger.correlationId = this.correlationId;
    childLogger.userId = this.userId;
    return childLogger;
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();

/**
 * Create a new logger instance with custom config
 */
export function createLogger(config?: Partial<LoggerConfig>): Logger {
  return new Logger(config);
}
