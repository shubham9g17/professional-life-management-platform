import { NotificationPreferences } from '@/components/notifications'

export default function NotificationsPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Notification Settings</h1>
        <p className="text-gray-600">
          Manage how and when you receive notifications from the platform
        </p>
      </div>

      <NotificationPreferences />
    </div>
  )
}
