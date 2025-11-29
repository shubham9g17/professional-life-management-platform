# Notification System

The notification system provides intelligent, user-friendly notifications for the Professional Life Management Platform.

## Features

- **Smart Timing**: Respects user-defined quiet hours
- **Frequency Limiting**: Prevents notification fatigue with configurable frequency (realtime, hourly, daily)
- **Type-Based Preferences**: Users can enable/disable specific notification types
- **Real-time Updates**: Notifications are polled every 30 seconds
- **Toast Notifications**: In-app toast notifications for immediate feedback
- **Notification History**: View and manage all notifications

## Components

### NotificationBell

Header component that displays unread notification count.

```tsx
import { NotificationBell } from '@/components/notifications'

<NotificationBell onClick={() => setShowNotifications(true)} />
```

### NotificationList

Displays a list of notifications with filtering and mark-as-read functionality.

```tsx
import { NotificationList } from '@/components/notifications'

<NotificationList onClose={() => setShowNotifications(false)} />
```

### NotificationPreferences

Settings component for managing notification preferences.

```tsx
import { NotificationPreferences } from '@/components/notifications'

<NotificationPreferences />
```

### ToastProvider & useToast

Context provider and hook for displaying toast notifications.

```tsx
// In your root layout
import { ToastProvider } from '@/components/notifications'

<ToastProvider>
  {children}
</ToastProvider>

// In any component
import { useToast } from '@/components/notifications'

const { showToast } = useToast()

showToast({
  title: 'Success',
  message: 'Task completed!',
  type: 'success',
  duration: 5000
})
```

## API Endpoints

### GET /api/notifications

Get all notifications for the authenticated user.

Query parameters:
- `unreadOnly` (boolean): Filter to unread notifications only
- `limit` (number): Maximum number of notifications to return
- `offset` (number): Pagination offset

### PATCH /api/notifications/[id]

Mark a specific notification as read.

### POST /api/notifications

Perform bulk actions on notifications.

Body:
```json
{
  "action": "markAllRead"
}
```

### GET /api/notifications/preferences

Get notification preferences for the authenticated user.

### PATCH /api/notifications/preferences

Update notification preferences.

Body:
```json
{
  "taskReminders": true,
  "habitNudges": true,
  "achievementNotifications": true,
  "budgetAlerts": true,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00",
  "notificationFrequency": "REALTIME"
}
```

## Notification Types

- **TASK_REMINDER**: Reminders for upcoming tasks
- **HABIT_NUDGE**: Gentle reminders for daily habits
- **ACHIEVEMENT**: Celebration of milestones and achievements
- **BUDGET_ALERT**: Alerts when approaching budget limits
- **GOAL_PROGRESS**: Updates on fitness goal progress

## Notification Service

The `NotificationService` provides methods for generating notifications based on system events.

```typescript
import { notificationService } from '@/lib/notifications/notification-service'

// Generate task reminders
await notificationService.generateTaskReminders()

// Generate habit nudges
await notificationService.generateHabitNudges()

// Generate budget alerts
await notificationService.generateBudgetAlerts()

// Generate goal progress notifications
await notificationService.generateGoalProgressNotifications()

// Run all notification generation tasks
await notificationService.generateAllNotifications()
```

## Notification Repository

The `NotificationRepository` provides low-level methods for managing notifications.

```typescript
import { notificationRepository } from '@/lib/repositories/notification-repository'

// Create a notification
await notificationRepository.createNotification({
  userId: 'user-id',
  type: 'TASK_REMINDER',
  title: 'Task Due Soon',
  message: 'Your task is due in 1 hour',
  data: { taskId: 'task-id' }
})

// Get notifications
const notifications = await notificationRepository.getNotifications(userId, {
  unreadOnly: true,
  limit: 50
})

// Mark as read
await notificationRepository.markAsRead(notificationId, userId)

// Get/update preferences
const prefs = await notificationRepository.getPreferences(userId)
await notificationRepository.updatePreferences(userId, { taskReminders: false })
```

## Smart Features

### Quiet Hours

Notifications will not be created during user-defined quiet hours. The system handles quiet hours that span midnight correctly.

### Frequency Limiting

- **REALTIME**: No limits, notifications sent immediately
- **HOURLY**: Maximum one notification of each type per hour
- **DAILY**: Maximum one notification of each type per day

### Type-Based Preferences

Users can enable/disable specific notification types:
- Task Reminders
- Habit Nudges
- Achievement Notifications
- Budget Alerts

## Scheduled Tasks

For production, set up a cron job or scheduled task to run notification generation:

```typescript
// Example: Run every 15 minutes
import { notificationService } from '@/lib/notifications/notification-service'

async function runNotificationGeneration() {
  const results = await notificationService.generateAllNotifications()
  console.log('Notifications generated:', results)
}

// Schedule with your preferred task scheduler
```

## Testing

The notification system includes smart timing logic and frequency limiting that should be tested with property-based tests to ensure correctness across various scenarios.

## Future Enhancements

- Push notifications for mobile devices
- Email notifications for important alerts
- Webhook support for external integrations
- Advanced notification scheduling
- Notification templates
- A/B testing for notification timing
