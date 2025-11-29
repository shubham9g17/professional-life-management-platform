/**
 * Error Types and Classes
 * 
 * Defines custom error types for the application with proper categorization
 * and metadata for logging and user feedback.
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  INTERNAL = 'INTERNAL',
}

/**
 * Base application error with metadata
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly correlationId?: string;
  public readonly metadata?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    category: ErrorCategory = ErrorCategory.INTERNAL,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    isOperational: boolean = true,
    metadata?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.category = category;
    this.severity = severity;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.metadata = metadata;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      category: this.category,
      severity: this.severity,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      metadata: this.metadata,
    };
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 400, ErrorCategory.VALIDATION, ErrorSeverity.LOW, true, metadata);
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', metadata?: Record<string, any>) {
    super(message, 401, ErrorCategory.AUTHENTICATION, ErrorSeverity.MEDIUM, true, metadata);
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', metadata?: Record<string, any>) {
    super(message, 403, ErrorCategory.AUTHORIZATION, ErrorSeverity.MEDIUM, true, metadata);
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string, metadata?: Record<string, any>) {
    super(`${resource} not found`, 404, ErrorCategory.NOT_FOUND, ErrorSeverity.LOW, true, metadata);
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 409, ErrorCategory.CONFLICT, ErrorSeverity.MEDIUM, true, metadata);
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', metadata?: Record<string, any>) {
    super(message, 429, ErrorCategory.RATE_LIMIT, ErrorSeverity.LOW, true, metadata);
  }
}

/**
 * Database error (500)
 */
export class DatabaseError extends AppError {
  constructor(message: string, metadata?: Record<string, any>) {
    super(message, 500, ErrorCategory.DATABASE, ErrorSeverity.HIGH, true, metadata);
  }
}

/**
 * Network error (503)
 */
export class NetworkError extends AppError {
  constructor(message: string = 'Network error', metadata?: Record<string, any>) {
    super(message, 503, ErrorCategory.NETWORK, ErrorSeverity.MEDIUM, true, metadata);
  }
}

/**
 * External service error (502)
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, metadata?: Record<string, any>) {
    super(`${service}: ${message}`, 502, ErrorCategory.EXTERNAL_SERVICE, ErrorSeverity.MEDIUM, true, metadata);
  }
}

/**
 * Internal server error (500)
 */
export class InternalError extends AppError {
  constructor(message: string = 'Internal server error', metadata?: Record<string, any>) {
    super(message, 500, ErrorCategory.INTERNAL, ErrorSeverity.HIGH, false, metadata);
  }
}
