import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { integrationService } from '@/lib/integrations/integration-service'

/**
 * GET /api/integrations
 * Get all integrations for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const integrations = await integrationService.getUserIntegrations(session.user.id)

    // Remove sensitive data before sending to client
    const sanitizedIntegrations = integrations.map(integration => ({
      id: integration.id,
      provider: integration.provider,
      status: integration.status,
      lastSyncAt: integration.lastSyncAt,
      syncFrequency: integration.syncFrequency,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    }))

    return NextResponse.json(sanitizedIntegrations)
  } catch (error) {
    console.error('Error fetching integrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}
