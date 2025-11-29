'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Integration {
  id: string
  provider: string
  status: string
  lastSyncAt: string | null
  syncFrequency: string
}

interface SyncStatusProps {
  compact?: boolean
}

export function SyncStatus({ compact = false }: SyncStatusProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIntegrations()
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchIntegrations, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations')
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data)
      }
    } catch (error) {
      console.error('Error fetching integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncAll = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        await fetchIntegrations()
      }
    } catch (error) {
      console.error('Error syncing integrations:', error)
    } finally {
      setSyncing(false)
    }
  }

  const activeIntegrations = integrations.filter(i => i.status === 'ACTIVE')
  const errorIntegrations = integrations.filter(i => i.status === 'ERROR')

  if (loading) {
    return (
      <div className="text-sm text-gray-500">
        Loading sync status...
      </div>
    )
  }

  if (integrations.length === 0) {
    return null
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${errorIntegrations.length > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
          <span className="text-xs text-gray-600">
            {activeIntegrations.length} active
          </span>
        </div>
        {errorIntegrations.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {errorIntegrations.length} error
          </Badge>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sync Status</h3>
        <Button
          size="sm"
          onClick={handleSyncAll}
          disabled={syncing || activeIntegrations.length === 0}
        >
          {syncing ? 'Syncing...' : 'Sync All'}
        </Button>
      </div>

      <div className="space-y-2">
        {integrations.map(integration => (
          <div
            key={integration.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full ${
                  integration.status === 'ACTIVE'
                    ? 'bg-green-500'
                    : integration.status === 'ERROR'
                    ? 'bg-red-500'
                    : 'bg-gray-500'
                }`}
              />
              <div>
                <div className="font-medium text-sm">
                  {integration.provider.replace(/_/g, ' ')}
                </div>
                <div className="text-xs text-gray-500">
                  {integration.lastSyncAt
                    ? `Last sync: ${new Date(integration.lastSyncAt).toLocaleString()}`
                    : 'Never synced'}
                </div>
              </div>
            </div>
            <Badge
              className={
                integration.status === 'ACTIVE'
                  ? 'bg-green-500'
                  : integration.status === 'ERROR'
                  ? 'bg-red-500'
                  : 'bg-gray-500'
              }
            >
              {integration.status}
            </Badge>
          </div>
        ))}
      </div>

      {errorIntegrations.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            {errorIntegrations.length} integration{errorIntegrations.length > 1 ? 's' : ''} need
            attention. Please reconnect or check settings.
          </p>
        </div>
      )}
    </div>
  )
}
