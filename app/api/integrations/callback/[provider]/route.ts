import { NextRequest, NextResponse } from 'next/server'
import { integrationService } from '@/lib/integrations/integration-service'

/**
 * GET /api/integrations/callback/[provider]
 * OAuth callback handler for integration providers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?integration_error=${error}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?integration_error=missing_parameters`
      )
    }

    // Decode and validate state
    let stateData
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?integration_error=invalid_state`
      )
    }

    const { userId, provider: stateProvider, timestamp } = stateData

    // Validate state timestamp (prevent replay attacks)
    const stateAge = Date.now() - timestamp
    if (stateAge > 10 * 60 * 1000) {
      // 10 minutes
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?integration_error=expired_state`
      )
    }

    // Validate provider matches
    if (stateProvider !== provider.toUpperCase()) {
      return NextResponse.json(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?integration_error=provider_mismatch`
      )
    }

    // Exchange code for token
    const tokenResponse = await integrationService.exchangeCodeForToken(
      stateProvider,
      code
    )

    if (!tokenResponse) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?integration_error=token_exchange_failed`
      )
    }

    // Create or update integration
    await integrationService.connectIntegration(
      userId,
      stateProvider,
      tokenResponse
    )

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?integration_success=${stateProvider.toLowerCase()}`
    )
  } catch (error) {
    console.error('Error handling OAuth callback:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?integration_error=callback_failed`
    )
  }
}
