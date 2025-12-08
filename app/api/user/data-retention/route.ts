/**
 * Data Retention Information Endpoint
 * Provides information about stored user data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { getDataRetentionInfo } from '@/lib/security/gdpr-compliance';
import { handleApiError, AuthenticationError } from '@/lib/error';
import { getOrCreateCorrelationId } from '@/lib/logging/correlation';
import { logger } from '@/lib/logging/logger';
import { applySecurityHeaders } from '@/lib/security/headers';
import { applyRateLimit, rateLimitConfigs } from '@/lib/security/rate-limit-middleware';

/**
 * GET /api/user/data-retention
 * Get information about stored user data
 */
export async function GET(request: NextRequest) {
  const correlationId = getOrCreateCorrelationId(request);
  
  try {
    // Apply rate limiting
    const rateLimitResult = applyRateLimit(request, rateLimitConfigs.read);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }
    
    logger.info('Data retention info requested', {
      userId: session.user.id,
      correlationId,
    });
    
    const retentionInfo = await getDataRetentionInfo(session.user.id);
    
    const response = NextResponse.json(retentionInfo);
    return applySecurityHeaders(response);
  } catch (error) {
    const errorResponse = handleApiError(error, correlationId);
    return applySecurityHeaders(errorResponse);
  }
}
