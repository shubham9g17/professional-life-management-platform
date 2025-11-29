/**
 * Global Error Handler
 * 
 * Centralized error handling with logging, formatting, and recovery logic.
 */

import { NextResponse } from 'next/server';
import { AppError, ErrorSeverity, InternalError } from './types';
import { logger } from '../logging/logger';
import { Prisma } from '@prisma/client';

/**
 * Error response format
 */
interface ErrorResponse {
  error: {
    message: string;
    code: string;
    statusCode: number;
    category?: string;
    timestamp: string;
    correlationId?: string;
    details?: any;
  };
}

/**
 * Format error for API response
 */
export function formatErrorResponse(error: Error, correlationId?: string): ErrorResponse {
  if (error instanceof AppError) {
    return {
      error: {
        message: error.message,
        code: error.name,
        statusCode: error.statusCode,
        category: error.category,
        timestamp: error.timestamp.toISOString(),
        correlationId: correlationId || error.correlationId,
        details: error.metadata,
      },
    };
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return {
      error: {
        message: getPrismaErrorMessage(error),
        code: 'DATABASE_ERROR',
        statusCode: 500,
        category: 'DATABASE',
        timestamp: new Date().toISOString(),
        correlationId,
        details: {
          code: error.code,
          meta: error.meta,
        },
      },
    };
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      error: {
        message: 'Invalid data provided',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        category: 'VALIDATION',
        timestamp: new Date().toISOString(),
        correlationId,
      },
    };
  }

  // Generic error
  return {
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      code: 'INTERNAL_ERROR',
      statusCode: 500,
      category: 'INTERNAL',
      timestamp: new Date().toISOString(),
      correlationId,
    },
  };
}

/**
 * Get user-friendly message for Prisma errors
 */
function getPrismaErrorMessage(error: Prisma.PrismaClientKnownRequestError): string {
  switch (error.code) {
    case 'P2002':
      return 'A record with this value already exists';
    case 'P2025':
      return 'Record not found';
    case 'P2003':
      return 'Invalid reference to related record';
    case 'P2014':
      return 'Invalid relation constraint';
    default:
      return 'Database operation failed';
  }
}

/**
 * Handle API errors and return formatted response
 */
export function handleApiError(error: unknown, correlationId?: string): NextResponse<ErrorResponse> {
  const err = error instanceof Error ? error : new InternalError('Unknown error occurred');
  
  // Log the error
  if (err instanceof AppError) {
    logger.error('API Error', {
      error: err.toJSON(),
      correlationId,
      stack: err.stack,
    });
  } else {
    logger.error('Unexpected Error', {
      message: err.message,
      name: err.name,
      correlationId,
      stack: err.stack,
    });
  }

  const response = formatErrorResponse(err, correlationId);
  return NextResponse.json(response, { status: response.error.statusCode });
}

/**
 * Determine if error is operational (expected) or programming error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Determine error severity
 */
export function getErrorSeverity(error: Error): ErrorSeverity {
  if (error instanceof AppError) {
    return error.severity;
  }
  return ErrorSeverity.HIGH;
}

/**
 * Global error handler for uncaught errors
 */
export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  if (typeof process !== 'undefined') {
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Promise Rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        promise: String(promise),
      });

      // Exit on critical errors in production
      if (!isOperationalError(reason) && process.env.NODE_ENV === 'production') {
        logger.critical('Non-operational error detected, shutting down', {
          reason: reason instanceof Error ? reason.message : String(reason),
        });
        process.exit(1);
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.critical('Uncaught Exception', {
        message: error.message,
        stack: error.stack,
      });

      // Always exit on uncaught exceptions
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    });
  }
}
