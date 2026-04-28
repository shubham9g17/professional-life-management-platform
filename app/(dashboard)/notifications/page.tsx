import { NotificationPreferences } from '@/components/notifications'

export default function NotificationsPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Notification settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage how and when you receive notifications from the platform.
        </p>
      </div>

      <NotificationPreferences />
    </div>
  )
}
