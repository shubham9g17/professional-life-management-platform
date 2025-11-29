/**
 * Task reminder logic based on priority and due date
 */

interface Task {
  id: string
  title: string
  priority: string
  dueDate?: Date | string
  status: string
}

interface ReminderSchedule {
  taskId: string
  reminderTimes: Date[]
  message: string
}

/**
 * Calculate when reminders should be sent for a task based on priority
 */
export function calculateReminderSchedule(task: Task): ReminderSchedule | null {
  // Don't send reminders for completed or archived tasks
  if (task.status === 'COMPLETED' || task.status === 'ARCHIVED') {
    return null
  }

  // Don't send reminders if no due date
  if (!task.dueDate) {
    return null
  }

  const dueDate = new Date(task.dueDate)
  const now = new Date()

  // Don't send reminders for past tasks
  if (dueDate < now) {
    return null
  }

  const reminderTimes: Date[] = []

  // Calculate reminder times based on priority
  switch (task.priority) {
    case 'URGENT':
      // Urgent: 24h, 12h, 6h, 3h, 1h, 30min before
      reminderTimes.push(
        new Date(dueDate.getTime() - 24 * 60 * 60 * 1000), // 24 hours
        new Date(dueDate.getTime() - 12 * 60 * 60 * 1000), // 12 hours
        new Date(dueDate.getTime() - 6 * 60 * 60 * 1000),  // 6 hours
        new Date(dueDate.getTime() - 3 * 60 * 60 * 1000),  // 3 hours
        new Date(dueDate.getTime() - 1 * 60 * 60 * 1000),  // 1 hour
        new Date(dueDate.getTime() - 30 * 60 * 1000)       // 30 minutes
      )
      break

    case 'HIGH':
      // High: 24h, 12h, 3h, 1h before
      reminderTimes.push(
        new Date(dueDate.getTime() - 24 * 60 * 60 * 1000), // 24 hours
        new Date(dueDate.getTime() - 12 * 60 * 60 * 1000), // 12 hours
        new Date(dueDate.getTime() - 3 * 60 * 60 * 1000),  // 3 hours
        new Date(dueDate.getTime() - 1 * 60 * 60 * 1000)   // 1 hour
      )
      break

    case 'MEDIUM':
      // Medium: 24h, 6h before
      reminderTimes.push(
        new Date(dueDate.getTime() - 24 * 60 * 60 * 1000), // 24 hours
        new Date(dueDate.getTime() - 6 * 60 * 60 * 1000)   // 6 hours
      )
      break

    case 'LOW':
      // Low: 24h before
      reminderTimes.push(
        new Date(dueDate.getTime() - 24 * 60 * 60 * 1000)  // 24 hours
      )
      break

    default:
      // Default to medium priority
      reminderTimes.push(
        new Date(dueDate.getTime() - 24 * 60 * 60 * 1000),
        new Date(dueDate.getTime() - 6 * 60 * 60 * 1000)
      )
  }

  // Filter out reminder times that are in the past
  const futureReminders = reminderTimes.filter(time => time > now)

  if (futureReminders.length === 0) {
    return null
  }

  return {
    taskId: task.id,
    reminderTimes: futureReminders,
    message: `Reminder: "${task.title}" is due ${formatTimeUntil(dueDate)}`,
  }
}

/**
 * Format time until due date in human-readable format
 */
function formatTimeUntil(dueDate: Date): string {
  const now = new Date()
  const diff = dueDate.getTime() - now.getTime()

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) {
    return `in ${days} day${days > 1 ? 's' : ''}`
  } else if (hours > 0) {
    return `in ${hours} hour${hours > 1 ? 's' : ''}`
  } else if (minutes > 0) {
    return `in ${minutes} minute${minutes > 1 ? 's' : ''}`
  } else {
    return 'very soon'
  }
}

/**
 * Get the next reminder time for a task
 */
export function getNextReminderTime(task: Task): Date | null {
  const schedule = calculateReminderSchedule(task)
  
  if (!schedule || schedule.reminderTimes.length === 0) {
    return null
  }

  // Return the earliest reminder time
  return schedule.reminderTimes[0]
}

/**
 * Check if a task should send a reminder now
 */
export function shouldSendReminder(task: Task, lastReminderSent?: Date): boolean {
  const nextReminder = getNextReminderTime(task)
  
  if (!nextReminder) {
    return false
  }

  const now = new Date()

  // If no reminder has been sent yet, check if it's time
  if (!lastReminderSent) {
    return nextReminder <= now
  }

  // Check if enough time has passed since last reminder
  const timeSinceLastReminder = now.getTime() - lastReminderSent.getTime()
  const minTimeBetweenReminders = 30 * 60 * 1000 // 30 minutes

  return nextReminder <= now && timeSinceLastReminder >= minTimeBetweenReminders
}

/**
 * Get all tasks that need reminders
 */
export function getTasksNeedingReminders(
  tasks: Task[],
  lastReminderTimes: Map<string, Date> = new Map()
): Task[] {
  return tasks.filter(task => {
    const lastReminder = lastReminderTimes.get(task.id)
    return shouldSendReminder(task, lastReminder)
  })
}
