'use client'

import { useEffect, useState } from 'react'
import { ResourceForm } from './resource-form'
import { ResourceList } from './resource-list'
import { ProgressTracker } from './progress-tracker'
import { Button } from '@/components/ui/button'

interface LearningResource {
  id: string
  title: string
  type: string
  category: string
  completionPercentage: number
  timeInvested: number
  startDate: string
  completedAt?: string | null
  notes?: string | null
  url?: string | null
}

interface LearningStats {
  total: number
  completed: number
  inProgress: number
  completionRate: number
  byType: Record<string, number>
  byCategory: Record<string, number>
  totalTimeInvested: number
  recentlyCompleted: Array<{
    id: string
    title: string
    type: string
    completedAt: string | null
    timeInvested: number
  }>
}

export function LearningDashboard() {
  const [resources, setResources] = useState<LearningResource[]>([])
  const [stats, setStats] = useState<LearningStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingResource, setEditingResource] = useState<LearningResource | null>(null)
  const [selectedResource, setSelectedResource] = useState<LearningResource | null>(null)

  useEffect(() => {
    fetchResources()
    fetchStats()
  }, [])

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/learning/resources')
      if (response.ok) {
        const data = await response.json()
        setResources(data.resources)
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/learning/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const handleCreateResource = async (data: any) => {
    try {
      const response = await fetch('/api/learning/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await fetchResources()
        await fetchStats()
        setShowForm(false)
      } else {
        throw new Error('Failed to create resource')
      }
    } catch (error) {
      console.error('Error creating resource:', error)
      throw error
    }
  }

  const handleUpdateResource = async (data: any) => {
    if (!editingResource) return

    try {
      const response = await fetch(`/api/learning/resources/${editingResource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await fetchResources()
        await fetchStats()
        setEditingResource(null)
        setShowForm(false)
      } else {
        throw new Error('Failed to update resource')
      }
    } catch (error) {
      console.error('Error updating resource:', error)
      throw error
    }
  }

  const handleDeleteResource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return

    try {
      const response = await fetch(`/api/learning/resources/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchResources()
        await fetchStats()
      }
    } catch (error) {
      console.error('Error deleting resource:', error)
    }
  }

  const handleUpdateProgress = async (id: string, progress: number, timeAdded: number) => {
    try {
      const response = await fetch(`/api/learning/resources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completionPercentage: progress,
          timeInvested: timeAdded,
        }),
      })

      if (response.ok) {
        await fetchResources()
        await fetchStats()
        setSelectedResource(null)
      } else {
        throw new Error('Failed to update progress')
      }
    } catch (error) {
      console.error('Error updating progress:', error)
      throw error
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Learning & Development</h1>
        <Button
          onClick={() => {
            setShowForm(!showForm)
            setEditingResource(null)
          }}
        >
          {showForm ? 'Cancel' : 'Add Resource'}
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Total Resources</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">In Progress</div>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Completed</div>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">Total Time</div>
            <div className="text-2xl font-bold">{formatTime(stats.totalTimeInvested)}</div>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">
            {editingResource ? 'Edit Resource' : 'Add New Resource'}
          </h2>
          <ResourceForm
            onSubmit={editingResource ? handleUpdateResource : handleCreateResource}
            initialData={editingResource ? {
              title: editingResource.title,
              type: editingResource.type as 'BOOK' | 'COURSE' | 'CERTIFICATION' | 'ARTICLE',
              category: editingResource.category,
              completionPercentage: editingResource.completionPercentage,
              timeInvested: editingResource.timeInvested,
              startDate: editingResource.startDate,
              notes: editingResource.notes || undefined,
              url: editingResource.url || undefined,
            } : undefined}
            isEditing={!!editingResource}
          />
        </div>
      )}

      {/* Progress Tracker */}
      {selectedResource && (
        <ProgressTracker
          resourceId={selectedResource.id}
          currentProgress={selectedResource.completionPercentage}
          currentTimeInvested={selectedResource.timeInvested}
          onUpdate={handleUpdateProgress}
        />
      )}

      {/* Resource List */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Your Learning Resources</h2>
        <ResourceList
          resources={resources}
          onEdit={(resource) => {
            setEditingResource(resource)
            setShowForm(true)
          }}
          onDelete={handleDeleteResource}
          onUpdateProgress={(id, percentage) => {
            const resource = resources.find((r) => r.id === id)
            if (resource) {
              setSelectedResource(resource)
            }
          }}
        />
      </div>

      {/* Recently Completed */}
      {stats && stats.recentlyCompleted.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Recently Completed</h2>
          <div className="space-y-2">
            {stats.recentlyCompleted.map((resource) => (
              <div
                key={resource.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div>
                  <div className="font-medium">{resource.title}</div>
                  <div className="text-sm text-gray-600">
                    {resource.type} • {formatTime(resource.timeInvested)}
                  </div>
                </div>
                {resource.completedAt && (
                  <div className="text-sm text-gray-500">
                    {new Date(resource.completedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
