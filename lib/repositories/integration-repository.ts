import { prisma } from '../prisma'
import type { Integration, Prisma } from '@prisma/client'

export interface CreateIntegrationInput {
  userId: string
  provider: string
  providerUserId?: string
  accessToken?: string
  refreshToken?: string
  tokenExpiry?: Date
  syncFrequency?: string
  config?: any
}

export interface UpdateIntegrationInput {
  providerUserId?: string
  accessToken?: string
  refreshToken?: string
  tokenExpiry?: Date
  status?: string
  lastSyncAt?: Date
  syncFrequency?: string
  config?: any
}

export class IntegrationRepository {
  /**
   * Create a new integration
   */
  async create(input: CreateIntegrationInput): Promise<Integration> {
    return prisma.integration.create({
      data: {
        userId: input.userId,
        provider: input.provider,
        providerUserId: input.providerUserId,
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        tokenExpiry: input.tokenExpiry,
        syncFrequency: input.syncFrequency || 'HOURLY',
        config: input.config || {},
      },
    })
  }

  /**
   * Get all integrations for a user
   */
  async findByUserId(userId: string): Promise<Integration[]> {
    return prisma.integration.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get a specific integration by ID
   */
  async findById(id: string, userId: string): Promise<Integration | null> {
    return prisma.integration.findFirst({
      where: { id, userId },
    })
  }

  /**
   * Get integration by provider
   */
  async findByProvider(
    userId: string,
    provider: string
  ): Promise<Integration | null> {
    return prisma.integration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    })
  }

  /**
   * Update an integration
   */
  async update(
    id: string,
    userId: string,
    input: UpdateIntegrationInput
  ): Promise<Integration> {
    return prisma.integration.update({
      where: { id },
      data: {
        ...input,
        updatedAt: new Date(),
      },
    })
  }

  /**
   * Delete an integration
   */
  async delete(id: string, userId: string): Promise<Integration> {
    return prisma.integration.delete({
      where: { id },
    })
  }

  /**
   * Get integrations that need syncing
   */
  async findDueForSync(): Promise<Integration[]> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    return prisma.integration.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          {
            syncFrequency: 'HOURLY',
            OR: [
              { lastSyncAt: null },
              { lastSyncAt: { lt: oneHourAgo } },
            ],
          },
          {
            syncFrequency: 'DAILY',
            OR: [
              { lastSyncAt: null },
              { lastSyncAt: { lt: oneDayAgo } },
            ],
          },
        ],
      },
    })
  }

  /**
   * Update last sync time
   */
  async updateLastSync(id: string): Promise<Integration> {
    return prisma.integration.update({
      where: { id },
      data: {
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      },
    })
  }

  /**
   * Update integration status
   */
  async updateStatus(
    id: string,
    status: string
  ): Promise<Integration> {
    return prisma.integration.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    })
  }
}

export const integrationRepository = new IntegrationRepository()
