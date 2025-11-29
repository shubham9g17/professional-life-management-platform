import { integrationRepository } from '../repositories/integration-repository'
import { prisma } from '../prisma'
import type { Integration } from '@prisma/client'

export interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  authorizationUrl: string
  tokenUrl: string
  scopes: string[]
}

export interface OAuthTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type: string
}

/**
 * Integration service for managing external service connections
 */
export class IntegrationService {
  private oauthConfigs: Map<string, OAuthConfig> = new Map()

  constructor() {
    this.initializeOAuthConfigs()
  }

  /**
   * Initialize OAuth configurations for supported providers
   */
  private initializeOAuthConfigs() {
    // Google Calendar OAuth config
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      this.oauthConfigs.set('GOOGLE_CALENDAR', {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/google`,
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
      })
    }

    // Outlook OAuth config
    if (process.env.OUTLOOK_CLIENT_ID && process.env.OUTLOOK_CLIENT_SECRET) {
      this.oauthConfigs.set('OUTLOOK', {
        clientId: process.env.OUTLOOK_CLIENT_ID,
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/callback/outlook`,
        authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        scopes: ['Calendars.Read', 'offline_access'],
      })
    }

    // Add more provider configs as needed
  }

  /**
   * Get OAuth authorization URL for a provider
   */
  getAuthorizationUrl(provider: string, state: string): string | null {
    const config = this.oauthConfigs.get(provider)
    if (!config) return null

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state,
      access_type: 'offline',
      prompt: 'consent',
    })

    return `${config.authorizationUrl}?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    provider: string,
    code: string
  ): Promise<OAuthTokenResponse | null> {
    const config = this.oauthConfigs.get(provider)
    if (!config) return null

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          redirect_uri: config.redirectUri,
          grant_type: 'authorization_code',
        }),
      })

      if (!response.ok) {
        console.error('Token exchange failed:', await response.text())
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Error exchanging code for token:', error)
      return null
    }
  }

  /**
   * Refresh an expired access token
   */
  async refreshAccessToken(
    provider: string,
    refreshToken: string
  ): Promise<OAuthTokenResponse | null> {
    const config = this.oauthConfigs.get(provider)
    if (!config) return null

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      })

      if (!response.ok) {
        console.error('Token refresh failed:', await response.text())
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Error refreshing token:', error)
      return null
    }
  }

  /**
   * Create or update integration after OAuth flow
   */
  async connectIntegration(
    userId: string,
    provider: string,
    tokenResponse: OAuthTokenResponse,
    providerUserId?: string
  ): Promise<Integration> {
    const tokenExpiry = tokenResponse.expires_in
      ? new Date(Date.now() + tokenResponse.expires_in * 1000)
      : undefined

    // Check if integration already exists
    const existing = await integrationRepository.findByProvider(userId, provider)

    if (existing) {
      // Update existing integration
      return integrationRepository.update(existing.id, userId, {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        tokenExpiry,
        providerUserId,
        status: 'ACTIVE',
        lastSyncAt: new Date(),
      })
    } else {
      // Create new integration
      return integrationRepository.create({
        userId,
        provider,
        providerUserId,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        tokenExpiry,
        syncFrequency: 'HOURLY',
      })
    }
  }

  /**
   * Disconnect an integration
   */
  async disconnectIntegration(id: string, userId: string): Promise<void> {
    await integrationRepository.delete(id, userId)
  }

  /**
   * Get all integrations for a user
   */
  async getUserIntegrations(userId: string): Promise<Integration[]> {
    return integrationRepository.findByUserId(userId)
  }

  /**
   * Sync data from an integration
   */
  async syncIntegration(integrationId: string, userId?: string): Promise<boolean> {
    // If userId not provided, fetch integration without userId filter
    let integration: Integration | null
    
    if (userId) {
      integration = await integrationRepository.findById(integrationId, userId)
    } else {
      // Fetch without userId filter - used for scheduled syncs
      integration = await prisma.integration.findUnique({
        where: { id: integrationId },
      })
    }

    if (!integration || integration.status !== 'ACTIVE') {
      return false
    }

    try {
      // Check if token needs refresh
      if (integration.tokenExpiry && integration.tokenExpiry < new Date()) {
        if (integration.refreshToken) {
          const newToken = await this.refreshAccessToken(
            integration.provider,
            integration.refreshToken
          )

          if (newToken) {
            await integrationRepository.update(integration.id, integration.userId, {
              accessToken: newToken.access_token,
              refreshToken: newToken.refresh_token || integration.refreshToken,
              tokenExpiry: newToken.expires_in
                ? new Date(Date.now() + newToken.expires_in * 1000)
                : undefined,
            })
          } else {
            await integrationRepository.updateStatus(integration.id, 'ERROR')
            return false
          }
        } else {
          await integrationRepository.updateStatus(integration.id, 'ERROR')
          return false
        }
      }

      // Perform provider-specific sync
      await this.performProviderSync(integration)

      // Update last sync time
      await integrationRepository.updateLastSync(integration.id)

      return true
    } catch (error) {
      console.error('Error syncing integration:', error)
      await integrationRepository.updateStatus(integration.id, 'ERROR')
      return false
    }
  }

  /**
   * Perform provider-specific data sync
   */
  private async performProviderSync(integration: Integration): Promise<void> {
    // This is a placeholder for provider-specific sync logic
    // In a real implementation, this would fetch data from the provider
    // and update the relevant models (tasks, events, etc.)
    
    switch (integration.provider) {
      case 'GOOGLE_CALENDAR':
        // Sync Google Calendar events to tasks
        break
      case 'OUTLOOK':
        // Sync Outlook calendar events to tasks
        break
      case 'FITBIT':
        // Sync Fitbit data to exercises and health metrics
        break
      case 'APPLE_HEALTH':
        // Sync Apple Health data
        break
      case 'TODOIST':
        // Sync Todoist tasks
        break
      case 'NOTION':
        // Sync Notion pages
        break
      default:
        console.warn(`Sync not implemented for provider: ${integration.provider}`)
    }
  }

  /**
   * Schedule automatic syncs for integrations
   */
  async scheduleSync(): Promise<void> {
    const integrations = await integrationRepository.findDueForSync()

    for (const integration of integrations) {
      // In a production environment, this would be handled by a job queue
      // For now, we'll just trigger the sync directly
      await this.syncIntegration(integration.id).catch(error => {
        console.error(`Failed to sync integration ${integration.id}:`, error)
      })
    }
  }

  /**
   * Get supported providers
   */
  getSupportedProviders(): string[] {
    return Array.from(this.oauthConfigs.keys())
  }

  /**
   * Check if a provider is configured
   */
  isProviderConfigured(provider: string): boolean {
    return this.oauthConfigs.has(provider)
  }
}

export const integrationService = new IntegrationService()
