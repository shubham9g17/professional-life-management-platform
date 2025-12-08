'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Integration {
  id: string
  provider: string
  status: string
  lastSyncAt: string | null
  syncFrequency: string
  createdAt: string
  updatedAt: string
}

const PROVIDER_INFO: Record<string, { name: string; description: string; icon: string }> = {
  GOOGLE_CALENDAR: {
    name: 'Google Calendar',
    description: 'Sync your calendar events with tasks',
    icon: '📅',
  },
  OUTLOOK: {
    name: 'Outlook Calendar',
    description: 'Sync your Outlook calendar with tasks',
    icon: '📧',
  },
  FITBIT: {
    name: 'Fitbit',
    description: 'Sync fitness data and activities',
    icon: '⌚',
  },
  APPLE_HEALTH: {
    name: 'Apple Health',
    description: 'Sync health and fitness data',
    icon: '🍎',
  },
  TODOIST: {
    name: 'Todoist',
    description: 'Sync tasks and projects',
    icon: '✓',
  },
  NOTION: {
    name: 'Notion',
    description: 'Sync pages and databases',
    icon: '📝',
  },
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    fetchIntegrations()
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

  const handleConnect = async (provider: string) => {
    setConnecting(provider)
    try {
      const response = await fetch('/api/integrations/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to OAuth authorization URL
        window.location.href = data.authorizationUrl
      } else {
        alert('Failed to initiate connection')
      }
    } catch (error) {
      console.error('Error connecting integration:', error)
      alert('Failed to connect integration')
    } finally {
      setConnecting(null)
    }
  }

  const handleDisconnect = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) {
      return
    }

    try {
      const response = await fetch(`/api/integrations/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setIntegrations(integrations.filter(i => i.id !== id))
      } else {
        alert('Failed to disconnect integration')
      }
    } catch (error) {
      console.error('Error disconnecting integration:', error)
      alert('Failed to disconnect integration')
    }
  }

  const handleSync = async (id: string) => {
    setSyncing(id)
    try {
      const response = await fetch('/api/integrations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId: id }),
      })

      if (response.ok) {
        await fetchIntegrations()
      } else {
        alert('Failed to sync integration')
      }
    } catch (error) {
      console.error('Error syncing integration:', error)
      alert('Failed to sync integration')
    } finally {
      setSyncing(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500'
      case 'ERROR':
        return 'bg-red-500'
      case 'DISCONNECTED':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const isConnected = (provider: string) => {
    return integrations.some(i => i.provider === provider && i.status === 'ACTIVE')
  }

  const getIntegration = (provider: string) => {
    return integrations.find(i => i.provider === provider)
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading integrations...</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Integrations</h1>
        <p className="text-gray-600">
          Connect external services to sync your data automatically
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(PROVIDER_INFO).map(([provider, info]) => {
          const integration = getIntegration(provider)
          const connected = isConnected(provider)

          return (
            <Card key={provider} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{info.icon}</div>
                  <div>
                    <h3 className="font-semibold">{info.name}</h3>
                    {connected && integration && (
                      <Badge className={getStatusColor(integration.status)}>
                        {integration.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{info.description}</p>

              {connected && integration ? (
                <div className="space-y-3">
                  <div className="text-xs text-gray-500">
                    <div>
                      Last sync:{' '}
                      {integration.lastSyncAt
                        ? new Date(integration.lastSyncAt).toLocaleString()
                        : 'Never'}
                    </div>
                    <div>Frequency: {integration.syncFrequency}</div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSync(integration.id)}
                      disabled={syncing === integration.id}
                    >
                      {syncing === integration.id ? 'Syncing...' : 'Sync Now'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDisconnect(integration.id)}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => handleConnect(provider)}
                  disabled={connecting === provider}
                  className="w-full"
                >
                  {connecting === provider ? 'Connecting...' : 'Connect'}
                </Button>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
