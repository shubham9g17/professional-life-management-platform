import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { integrationService } from '@/lib/integrations/integration-service'
import { integrationRepository } from '@/lib/repositories/integration-repository'

/**
 * POST /api/integrations/sync
 * Manually trigger sync for an integration or all integrations
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { integrationId } = body

    if (integrationId) {
      // Sync specific integration
      const integration = await integrationRepository.findById(
        integrationId,
        session.user.id
      )

      if (!integration) {
        return NextResponse.json(
          { error: 'Integration not found' },
          { status: 404 }
        )
      }

      const success = await integrationService.syncIntegration(integrationId)

      return NextResponse.json({
        success,
        message: success
          ? 'Integration synced successfully'
          : 'Failed to sync integration',
      })
    } else {
      // Sync all user integrations
      const integrations = await integrationService.getUserIntegrations(
        session.user.id
      )

      const results = await Promise.allSettled(
        integrations
          .filter(i => i.status === 'ACTIVE')
          .map(i => integrationService.syncIntegration(i.id))
      )

      const successCount = results.filter(
        r => r.status === 'fulfilled' && r.value === true
      ).length

      return NextResponse.json({
        total: integrations.length,
        synced: successCount,
        message: `Synced ${successCount} of ${integrations.length} integrations`,
      })
    }
  } catch (error) {
    console.error('Error syncing integrations:', error)
    return NextResponse.json(
      { error: 'Failed to sync integrations' },
      { status: 500 }
    )
  }
}
