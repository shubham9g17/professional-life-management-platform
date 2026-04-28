'use client'

import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  Mail,
  Watch,
  HeartPulse,
  CheckSquare,
  StickyNote,
  Plug,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface Integration {
  id: string
  provider: string
  status: string
  lastSyncAt: string | null
  syncFrequency: string
  createdAt: string
  updatedAt: string
}

const PROVIDER_INFO: Record<
  string,
  { name: string; description: string; Icon: typeof CalendarIcon; tint: string }
> = {
  GOOGLE_CALENDAR: {
    name: 'Google Calendar',
    description: 'Sync your calendar events with tasks',
    Icon: CalendarIcon,
    tint: 'text-chart-1',
  },
  OUTLOOK: {
    name: 'Outlook Calendar',
    description: 'Sync your Outlook calendar with tasks',
    Icon: Mail,
    tint: 'text-chart-2',
  },
  FITBIT: {
    name: 'Fitbit',
    description: 'Sync fitness data and activities',
    Icon: Watch,
    tint: 'text-chart-3',
  },
  APPLE_HEALTH: {
    name: 'Apple Health',
    description: 'Sync health and fitness data',
    Icon: HeartPulse,
    tint: 'text-destructive',
  },
  TODOIST: {
    name: 'Todoist',
    description: 'Sync tasks and projects',
    Icon: CheckSquare,
    tint: 'text-chart-4',
  },
  NOTION: {
    name: 'Notion',
    description: 'Sync pages and databases',
    Icon: StickyNote,
    tint: 'text-foreground',
  },
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)
  const reduce = useReducedMotion()

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

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-success/10 text-success ring-1 ring-success/20'
      case 'ERROR':
        return 'bg-destructive/10 text-destructive ring-1 ring-destructive/20'
      default:
        return 'bg-muted text-muted-foreground ring-1 ring-border'
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
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-[var(--card-radius)]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Plug className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Integrations
          </h1>
          <p className="text-sm text-muted-foreground">
            Connect external services to sync your data automatically.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(PROVIDER_INFO).map(([provider, info], i) => {
          const integration = getIntegration(provider)
          const connected = isConnected(provider)
          const Icon = info.Icon

          return (
            <motion.article
              key={provider}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={reduce ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: reduce ? 0 : Math.min(i, 8) * 0.04 }}
              className="bento-card flex flex-col p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50 ring-1 ring-border', info.tint)}>
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{info.name}</h3>
                    {connected && integration && (
                      <span
                        className={cn(
                          'mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide',
                          getStatusBadgeStyles(integration.status)
                        )}
                      >
                        {integration.status.toLowerCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-3 flex-1 text-sm text-muted-foreground">{info.description}</p>

              {connected && integration ? (
                <div className="mt-4 space-y-3">
                  <dl className="text-xs text-muted-foreground">
                    <div className="flex justify-between gap-2">
                      <dt>Last sync</dt>
                      <dd className="text-foreground">
                        {integration.lastSyncAt
                          ? new Date(integration.lastSyncAt).toLocaleString()
                          : 'Never'}
                      </dd>
                    </div>
                    <div className="mt-1 flex justify-between gap-2">
                      <dt>Frequency</dt>
                      <dd className="text-foreground">{integration.syncFrequency}</dd>
                    </div>
                  </dl>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSync(integration.id)}
                      disabled={syncing === integration.id}
                      aria-label={`Sync ${info.name}`}
                    >
                      <RefreshCw
                        className={cn('h-3.5 w-3.5', syncing === integration.id && 'animate-spin')}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      {syncing === integration.id ? 'Syncing' : 'Sync now'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDisconnect(integration.id)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Disconnect ${info.name}`}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => handleConnect(provider)}
                  disabled={connecting === provider}
                  className="mt-4 w-full"
                >
                  {connecting === provider ? 'Connecting…' : 'Connect'}
                </Button>
              )}
            </motion.article>
          )
        })}
      </div>
    </motion.div>
  )
}
