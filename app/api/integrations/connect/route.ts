import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { integrationService } from '@/lib/integrations/integration-service'

/**
 * POST /api/integrations/connect
 * Initiate OAuth flow for connecting an integration
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
    const { provider } = body

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      )
    }

    // Check if provider is supported
    if (!integrationService.isProviderConfigured(provider)) {
      return NextResponse.json(
        { error: 'Provider not supported or not configured' },
        { status: 400 }
      )
    }

    // Generate state parameter for OAuth security
    const state = Buffer.from(
      JSON.stringify({
        userId: session.user.id,
        provider,
        timestamp: Date.now(),
      })
    ).toString('base64')

    // Get authorization URL
    const authUrl = integrationService.getAuthorizationUrl(provider, state)

    if (!authUrl) {
      return NextResponse.json(
        { error: 'Failed to generate authorization URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      authorizationUrl: authUrl,
      state,
    })
  } catch (error) {
    console.error('Error initiating integration connection:', error)
    return NextResponse.json(
      { error: 'Failed to initiate connection' },
      { status: 500 }
    )
  }
}
