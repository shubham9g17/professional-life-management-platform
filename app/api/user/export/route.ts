/**
 * GDPR Data Export Endpoint
 * Allows users to export all their data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { exportUserData } from '@/lib/security/gdpr-compliance';
import { handleApiError, AuthenticationError } from '@/lib/error';
import { getOrCreateCorrelationId } from '@/lib/logging/correlation';
import { logger } from '@/lib/logging/logger';
import { applySecurityHeaders } from '@/lib/security/headers';
import { applyRateLimit, rateLimitConfigs } from '@/lib/security/rate-limit-middleware';

/**
 * GET /api/user/export
 * Export all user data in JSON format (GDPR compliance)
 */
export async function GET(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  
  try {
    // Apply strict rate limiting for export operations
    const rateLimitResult = applyRateLimit(request, rateLimitConfigs.export);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }
    
    logger.info('User data export requested', {
      userId: session.user.id,
      correlationId,
    });
    
    // Export all user data
    const exportData = await exportUserData(session.user.id);
    
    logger.info('User data export completed', {
      userId: session.user.id,
      correlationId,
    });
    
    const response = NextResponse.json(exportData);
    
    // Add headers for file download
    response.headers.set(
      'Content-Disposition',
      `attachment; filename="user-data-export-${session.user.id}-${Date.now()}.json"`
    );
    
    return applySecurityHeaders(response);
  } catch (error) {
    const errorResponse = handleApiError(error, correlationId);
    return applySecurityHeaders(errorResponse);
  }
}
