import { prisma } from '../prisma'

export interface CreateHabitInput {
  userId: string
  name: string
  category: 'PROFESSIONAL_DEVELOPMENT' | 'HEALTH' | 'PRODUCTIVITY' | 'PERSONAL_GROWTH'
  frequency: 'DAILY' | 'WEEKLY' | 'CUSTOM'
}

export interface UpdateHabitInput {
  name?: string
  category?: 'PROFESSIONAL_DEVELOPMENT' | 'HEALTH' | 'PRODUCTIVITY' | 'PERSONAL_GROWTH'
  frequency?: 'DAILY' | 'WEEKLY' | 'CUSTOM'
}

export interface HabitWithCompletions {
  id: string
  userId: string
  name: string
  category: string
  frequency: string
  currentStreak: number
  longestStreak: number
  completionRate: number
  lastCompletedAt: Date | null
  createdAt: Date
  updatedAt: Date
  completions: Array<{
    id: string
    habitId: string
    completedAt: Date
    notes: string | null
  }>
}

/**
 * Calculate the current streak for a habit based on completion dates
 * A streak is consecutive days with completions
 */
export function calculateStreak(completionDates: Date[]): number {
  if (completionDates.length === 0) return 0

  // Sort dates in descending order (most recent first)
  const sortedDates = completionDates
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime())

  // Get today's date at midnight
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get the most recent completion date at midnight
  const mostRecent = new Date(sortedDates[0])
  mostRecent.setHours(0, 0, 0, 0)

  // Check if the most recent completion is today or yesterday
  const daysDiff = Math.floor((today.getTime() - mostRecent.getTime()) / (1000 * 60 * 60 * 24))
  
  // If more than 1 day has passed, streak is broken
  if (daysDiff > 1) return 0

  // Count consecutive days
  let streak = 1
  let currentDate = new Date(mostRecent)

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i])
    prevDate.setHours(0, 0, 0, 0)

    // Calculate expected previous date (one day before current)
    const expectedPrevDate = new Date(currentDate)
    expectedPrevDate.setDate(expectedPrevDate.getDate() - 1)

    // Check if this completion is exactly one day before
    if (prevDate.getTime() === expectedPrevDate.getTime()) {
      streak++
      currentDate = prevDate
    } else {
      // Streak is broken
      break
    }
  }

  return streak
}

/**
 * Calculate completion rate for a habit
 * Returns percentage of days completed since habit creation
 */
export function calculateCompletionRate(
  createdAt: Date,
  completionCount: number
): number {
  const now = new Date()
  const created = new Date(createdAt)
  
  // Calculate days since creation (minimum 1 day)
  const daysSinceCreation = Math.max(
    1,
    Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  )

  // Calculate completion rate as percentage
  const rate = (completionCount / daysSinceCreation) * 100

  // Cap at 100% and round to 2 decimal places
  return Math.min(100, Math.round(rate * 100) / 100)
}

/**
 * Get all habits for a user with completion data
 */
export async function getHabitsWithCompletions(
  userId: string
): Promise<HabitWithCompletions[]> {
  const habits = await prisma.habit.findMany({
    where: { userId },
    include: {
      completions: {
        orderBy: { completedAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return habits
}

/**
 * Get a single habit by ID with completion data
 */
export async function getHabitById(
  habitId: string,
  userId: string
): Promise<HabitWithCompletions | null> {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
    include: {
      completions: {
        orderBy: { completedAt: 'desc' },
      },
    },
  })

  return habit
}

/**
 * Create a new habit
 */
export async function createHabit(input: CreateHabitInput) {
  return await prisma.habit.create({
    data: {
      userId: input.userId,
      name: input.name,
      category: input.category,
      frequency: input.frequency,
      currentStreak: 0,
      longestStreak: 0,
      completionRate: 0,
    },
    include: {
      completions: true,
    },
  })
}

/**
 * Update a habit
 */
export async function updateHabit(
  habitId: string,
  userId: string,
  input: UpdateHabitInput
) {
  return await prisma.habit.update({
    where: { id: habitId, userId },
    data: input,
    include: {
      completions: true,
    },
  })
}

/**
 * Delete a habit
 */
export async function deleteHabit(habitId: string, userId: string) {
  return await prisma.habit.delete({
    where: { id: habitId, userId },
  })
}

/**
 * Complete a habit and update streak
 */
export async function completeHabit(
  habitId: string,
  userId: string,
  notes?: string
) {
  // Get the habit with all completions
  const habit = await getHabitById(habitId, userId)
  
  if (!habit) {
    throw new Error('Habit not found')
  }

  // Create the completion record
  const completion = await prisma.habitCompletion.create({
    data: {
      habitId,
      notes,
    },
  })

  // Get all completion dates including the new one
  const allCompletions = [...habit.completions, completion]
  const completionDates = allCompletions.map(c => c.completedAt)

  // Calculate new streak
  const newStreak = calculateStreak(completionDates)

  // Calculate new completion rate
  const newCompletionRate = calculateCompletionRate(
    habit.createdAt,
    allCompletions.length
  )

  // Update habit with new metrics
  const updatedHabit = await prisma.habit.update({
    where: { id: habitId },
    data: {
      currentStreak: newStreak,
      longestStreak: Math.max(habit.longestStreak, newStreak),
      completionRate: newCompletionRate,
      lastCompletedAt: completion.completedAt,
    },
    include: {
      completions: {
        orderBy: { completedAt: 'desc' },
      },
    },
  })

  return updatedHabit
}

/**
 * Get habits filtered by category
 */
export async function getHabitsByCategory(
  userId: string,
  category: string
): Promise<HabitWithCompletions[]> {
  const habits = await prisma.habit.findMany({
    where: { userId, category },
    include: {
      completions: {
        orderBy: { completedAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return habits
}
