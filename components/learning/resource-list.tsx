'use client'

import { useState } from 'react'
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

interface ResourceListProps {
  resources: LearningResource[]
  onEdit?: (resource: LearningResource) => void
  onDelete?: (id: string) => void
  onUpdateProgress?: (id: string, percentage: number) => void
}

export function ResourceList({ resources, onEdit, onDelete, onUpdateProgress }: ResourceListProps) {
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')

  const filteredResources = resources.filter((resource) => {
    if (filter === 'IN_PROGRESS' && resource.completionPercentage >= 100) return false
    if (filter === 'COMPLETED' && resource.completionPercentage < 100) return false
    if (typeFilter !== 'ALL' && resource.type !== typeFilter) return false
    return true
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BOOK':
        return 'bg-blue-100 text-blue-800'
      case 'COURSE':
        return 'bg-green-100 text-green-800'
      case 'CERTIFICATION':
        return 'bg-purple-100 text-purple-800'
      case 'ARTICLE':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex gap-2">
          <Button
            variant={filter === 'ALL' ? 'default' : 'outline'}
            onClick={() => setFilter('ALL')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filter === 'IN_PROGRESS' ? 'default' : 'outline'}
            onClick={() => setFilter('IN_PROGRESS')}
            size="sm"
          >
            In Progress
          </Button>
          <Button
            variant={filter === 'COMPLETED' ? 'default' : 'outline'}
            onClick={() => setFilter('COMPLETED')}
            size="sm"
          >
            Completed
          </Button>
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Types</option>
          <option value="BOOK">Books</option>
          <option value="COURSE">Courses</option>
          <option value="CERTIFICATION">Certifications</option>
          <option value="ARTICLE">Articles</option>
        </select>
      </div>

      {/* Resource List */}
      {filteredResources.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No learning resources found.</p>
          <p className="text-sm mt-2">Create your first resource to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{resource.title}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                        resource.type
                      )}`}
                    >
                      {resource.type}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{resource.category}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span>Started: {formatDate(resource.startDate)}</span>
                    {resource.completedAt && (
                      <span>Completed: {formatDate(resource.completedAt)}</span>
                    )}
                    <span>Time: {formatTime(resource.timeInvested)}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm font-medium text-gray-700">
                        {resource.completionPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${resource.completionPercentage}%` }}
                      />
                    </div>
                  </div>

                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Resource →
                    </a>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {onEdit && (
                    <Button variant="outline" size="sm" onClick={() => onEdit(resource)}>
                      Edit
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(resource.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
