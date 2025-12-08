/**
 * GDPR Data Deletion Endpoint
 * Allows users to delete all their data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { deleteUserData } from '@/lib/security/gdpr-compliance';
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/error';
import { getOrCreateCorrelationId } from '@/lib/logging/correlation';
import { logger } from '@/lib/logging/logger';
import { applySecurityHeaders } from '@/lib/security/headers';
import { applyRateLimit, rateLimitConfigs } from '@/lib/security/rate-limit-middleware';

/**
 * DELETE /api/user/delete
 * Delete all user data (GDPR Right to Erasure)
 * Requires confirmation in request body
 */
export async function DELETE(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  
  try {
    // Apply rate limiting
    const rateLimitResult = applyRateLimit(request, rateLimitConfigs.auth);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }
    
    // Require confirmation
    const body = await request.json();
    
    if (body.confirmation !== 'DELETE_MY_DATA') {
      throw new ValidationError('Confirmation required. Please send { "confirmation": "DELETE_MY_DATA" }');
    }
    
    logger.warn('User data deletion requested', {
      userId: session.user.id,
      correlationId,
    });
    
    // Delete all user data
    await deleteUserData(session.user.id);
    
    logger.warn('User data deletion completed', {
      userId: session.user.id,
      correlationId,
    });
    
    const response = NextResponse.json({
      message: 'All user data has been permanently deleted',
      deletedAt: new Date().toISOString(),
    });
    
    return applySecurityHeaders(response);
  } catch (error) {
    const errorResponse = handleApiError(error, correlationId);
    return applySecurityHeaders(errorResponse);
  }
}
