'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

type ExportFormat = 'JSON' | 'CSV' | 'PDF'

const ENTITY_OPTIONS = [
  { value: 'profile', label: 'Profile' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'habits', label: 'Habits' },
  { value: 'transactions', label: 'Transactions' },
  { value: 'budgets', label: 'Budgets' },
  { value: 'exercises', label: 'Exercises' },
  { value: 'healthMetrics', label: 'Health Metrics' },
  { value: 'fitnessGoals', label: 'Fitness Goals' },
  { value: 'meals', label: 'Meals' },
  { value: 'waterIntake', label: 'Water Intake' },
  { value: 'learningResources', label: 'Learning Resources' },
  { value: 'dailyMetrics', label: 'Daily Metrics' },
  { value: 'achievements', label: 'Achievements' },
]

export function ExportPanel() {
  const [format, setFormat] = useState<ExportFormat>('JSON')
  const [selectedEntities, setSelectedEntities] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [exporting, setExporting] = useState(false)

  const handleEntityToggle = (entity: string) => {
    setSelectedEntities(prev =>
      prev.includes(entity)
        ? prev.filter(e => e !== entity)
        : [...prev, entity]
    )
  }

  const handleSelectAll = () => {
    if (selectedEntities.length === ENTITY_OPTIONS.length) {
      setSelectedEntities([])
    } else {
      setSelectedEntities(ENTITY_OPTIONS.map(e => e.value))
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams({
        format,
      })

      if (selectedEntities.length > 0) {
        params.append('entities', selectedEntities.join(','))
      }

      if (startDate) {
        params.append('startDate', startDate)
      }

      if (endDate) {
        params.append('endDate', endDate)
      }

      const response = await fetch(`/api/export?${params.toString()}`)

      if (response.ok) {
        // Get filename from Content-Disposition header or generate one
        const contentDisposition = response.headers.get('Content-Disposition')
        let filename = `export.${format.toLowerCase()}`
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        }

        // Download the file
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to export data')
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Export Data</h2>
          <p className="text-gray-600">
            Download your data in various formats for backup or analysis
          </p>
        </div>

        {/* Format Selection */}
        <div>
          <Label className="mb-2 block">Export Format</Label>
          <div className="flex gap-2">
            {(['JSON', 'CSV', 'PDF'] as ExportFormat[]).map(f => (
              <Button
                key={f}
                variant={format === f ? 'default' : 'outline'}
                onClick={() => setFormat(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        {/* Entity Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Data to Export</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedEntities.length === ENTITY_OPTIONS.length
                ? 'Deselect All'
                : 'Select All'}
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {ENTITY_OPTIONS.map(entity => (
              <label
                key={entity.value}
                className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedEntities.includes(entity.value)}
                  onChange={() => handleEntityToggle(entity.value)}
                  className="rounded"
                />
                <span className="text-sm">{entity.label}</span>
              </label>
            ))}
          </div>
          {selectedEntities.length === 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Leave empty to export all data
            </p>
          )}
        </div>

        {/* Date Range */}
        <div>
          <Label className="mb-2 block">Date Range (Optional)</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">
                Start Date
              </Label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-600 mb-1 block">
                End Date
              </Label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Leave empty to export all historical data
          </p>
        </div>

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={exporting}
          className="w-full"
          size="lg"
        >
          {exporting ? 'Exporting...' : `Export as ${format}`}
        </Button>

        {/* Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-sm mb-1">Export Information</h4>
          <ul className="text-xs text-gray-700 space-y-1">
            <li>• JSON: Complete data with full structure</li>
            <li>• CSV: Spreadsheet-compatible format</li>
            <li>• PDF: Professional report format</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}
