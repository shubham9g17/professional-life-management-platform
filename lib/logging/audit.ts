/**
 * Audit Logging
 * 
 * Tracks user actions and data access for security and compliance
 */

import { prisma } from '../prisma';
import { logger } from './logger';
import { AuditLogEntry } from './types';

/**
 * Audit action types
 */
export enum AuditAction {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  SIGNUP = 'SIGNUP',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  
  // Data operations
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  
  // Sensitive operations
  EXPORT_DATA = 'EXPORT_DATA',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  CHANGE_PERMISSIONS = 'CHANGE_PERMISSIONS',
  
  // Integration
  CONNECT_INTEGRATION = 'CONNECT_INTEGRATION',
  DISCONNECT_INTEGRATION = 'DISCONNECT_INTEGRATION',
  SYNC_DATA = 'SYNC_DATA',
}

/**
 * Resource types for audit logging
 */
export enum AuditResource {
  USER = 'USER',
  TASK = 'TASK',
  HABIT = 'HABIT',
  TRANSACTION = 'TRANSACTION',
  EXERCISE = 'EXERCISE',
  MEAL = 'MEAL',
  LEARNING_RESOURCE = 'LEARNING_RESOURCE',
  NOTIFICATION = 'NOTIFICATION',
  INTEGRATION = 'INTEGRATION',
}

/**
 * Audit logger class
 */
class AuditLogger {
  /**
   * Log user action
   */
  async log(
    userId: string,
    action: AuditAction,
    resource: AuditResource,
    resourceId?: string,
    metadata?: Record<string, any>,
    request?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    const entry: AuditLogEntry = {
      userId,
      action,
      resource,
      resourceId,
      timestamp: new Date().toISOString(),
      ipAddress: request?.ipAddress,
      userAgent: request?.userAgent,
      metadata,
    };

    // Log to console/file
    logger.info('Audit log', entry);

    // Store in database for compliance
    try {
      // Note: This would require an AuditLog model in Prisma schema
      // For now, we'll just log to the logger
      // In production, you'd want to store this in a dedicated audit table
      
      // await prisma.auditLog.create({
      //   data: {
      //     userId,
      //     action,
      //     resource,
      //     resourceId,
      //     ipAddress: request?.ipAddress,
      //     userAgent: request?.userAgent,
      //     metadata: metadata ? JSON.stringify(metadata) : null,
      //   },
      // });
    } catch (error) {
      logger.error('Failed to store audit log', {
        error: error instanceof Error ? error.message : String(error),
        entry,
      });
    }
  }

  /**
   * Log authentication event
   */
  async logAuth(
    userId: string,
    action: AuditAction.LOGIN | AuditAction.LOGOUT | AuditAction.SIGNUP,
    success: boolean,
    request?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.log(
      userId,
      action,
      AuditResource.USER,
      userId,
      { success },
      request
    );
  }

  /**
   * Log data access
   */
  async logDataAccess(
    userId: string,
    action: AuditAction.CREATE | AuditAction.READ | AuditAction.UPDATE | AuditAction.DELETE,
    resource: AuditResource,
    resourceId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log(userId, action, resource, resourceId, metadata);
  }

  /**
   * Log sensitive operation
   */
  async logSensitiveOperation(
    userId: string,
    action: AuditAction,
    metadata?: Record<string, any>,
    request?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.log(
      userId,
      action,
      AuditResource.USER,
      userId,
      metadata,
      request
    );
    
    // Also log as critical for immediate attention
    logger.critical('Sensitive operation performed', {
      userId,
      action,
      metadata,
    });
  }

  /**
   * Query audit logs for a user
   */
  async getUserAuditLogs(
    userId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      action?: AuditAction;
      resource?: AuditResource;
      limit?: number;
    }
  ): Promise<AuditLogEntry[]> {
    // This would query the audit log table
    // For now, return empty array as we're not storing in DB yet
    logger.info('Querying audit logs', { userId, options });
    return [];
  }
}

/**
 * Global audit logger instance
 */
export const auditLogger = new AuditLogger();

/**
 * Middleware helper to extract request info
 */
export function extractRequestInfo(request: Request): {
  ipAddress?: string;
  userAgent?: string;
} {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               undefined,
    userAgent: request.headers.get('user-agent') || undefined,
  };
}
