'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface NotificationPreferences {
  taskReminders: boolean
  habitNudges: boolean
  achievementNotifications: boolean
  budgetAlerts: boolean
  quietHoursStart?: string | null
  quietHoursEnd?: string | null
  notificationFrequency: 'REALTIME' | 'HOURLY' | 'DAILY'
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    taskReminders: true,
    habitNudges: true,
    achievementNotifications: true,
    budgetAlerts: true,
    quietHoursStart: null,
    quietHoursEnd: null,
    notificationFrequency: 'REALTIME',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/notifications/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
      setMessage({ type: 'error', text: 'Failed to load preferences' })
    } finally {
      setIsLoading(false)
    }
  }

  const savePreferences = async () => {
    try {
      setIsSaving(true)
      setMessage(null)
      
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Preferences saved successfully' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save preferences' })
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
      setMessage({ type: 'error', text: 'Failed to save preferences' })
    } finally {
      setIsSaving(false)
    }
  }

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Manage how and when you receive notifications
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Notification Types */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Notification Types</h3>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="taskReminders">Task Reminders</Label>
              <p className="text-sm text-gray-500">
                Get reminded about upcoming tasks
              </p>
            </div>
            <Switch
              id="taskReminders"
              checked={preferences.taskReminders}
              onCheckedChange={(checked) => updatePreference('taskReminders', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="habitNudges">Habit Nudges</Label>
              <p className="text-sm text-gray-500">
                Get gentle reminders for daily habits
              </p>
            </div>
            <Switch
              id="habitNudges"
              checked={preferences.habitNudges}
              onCheckedChange={(checked) => updatePreference('habitNudges', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="achievementNotifications">Achievement Notifications</Label>
              <p className="text-sm text-gray-500">
                Celebrate milestones and achievements
              </p>
            </div>
            <Switch
              id="achievementNotifications"
              checked={preferences.achievementNotifications}
              onCheckedChange={(checked) => updatePreference('achievementNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="budgetAlerts">Budget Alerts</Label>
              <p className="text-sm text-gray-500">
                Get notified when approaching budget limits
              </p>
            </div>
            <Switch
              id="budgetAlerts"
              checked={preferences.budgetAlerts}
              onCheckedChange={(checked) => updatePreference('budgetAlerts', checked)}
            />
          </div>
        </div>

        {/* Notification Frequency */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Notification Frequency</h3>
          
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="frequency"
                value="REALTIME"
                checked={preferences.notificationFrequency === 'REALTIME'}
                onChange={(e) => updatePreference('notificationFrequency', e.target.value as any)}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <span className="font-medium">Real-time</span>
                <p className="text-sm text-gray-500">Receive notifications immediately</p>
              </div>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="frequency"
                value="HOURLY"
                checked={preferences.notificationFrequency === 'HOURLY'}
                onChange={(e) => updatePreference('notificationFrequency', e.target.value as any)}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <span className="font-medium">Hourly</span>
                <p className="text-sm text-gray-500">Batch notifications every hour</p>
              </div>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="frequency"
                value="DAILY"
                checked={preferences.notificationFrequency === 'DAILY'}
                onChange={(e) => updatePreference('notificationFrequency', e.target.value as any)}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <span className="font-medium">Daily</span>
                <p className="text-sm text-gray-500">Receive a daily summary</p>
              </div>
            </label>
          </div>
        </div>

        {/* Quiet Hours */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Quiet Hours</h3>
          <p className="text-sm text-gray-500">
            Set times when you don't want to receive notifications
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quietHoursStart">Start Time</Label>
              <Input
                id="quietHoursStart"
                type="time"
                value={preferences.quietHoursStart || ''}
                onChange={(e) => updatePreference('quietHoursStart', e.target.value || null)}
                placeholder="HH:mm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quietHoursEnd">End Time</Label>
              <Input
                id="quietHoursEnd"
                type="time"
                value={preferences.quietHoursEnd || ''}
                onChange={(e) => updatePreference('quietHoursEnd', e.target.value || null)}
                placeholder="HH:mm"
              />
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={savePreferences}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardContent>
    </Card>
  )
}
