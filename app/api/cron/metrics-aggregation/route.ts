import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logging'
import { calculateProductivityScore, calculateWellnessScore, calculateGrowthScore } from '@/lib/analytics/metrics-engine'

/**
 * Metrics Aggregation Cron Job
 * 
 * Runs hourly to aggregate and update user metrics:
 * - Calculate daily metrics for all active users
 * - Update productivity, wellness, and growth scores
 * - Generate insights and achievements
 * 
 * Scheduled to run hourly via vercel.json
 */
export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const results = {
    usersProcessed: 0,
    metricsUpdated: 0,
    errors: 0,
  }

  try {
    // Get all active users (users with activity in the last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const activeUsers = await prisma.user.findMany({
      where: {
        updatedAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        id: true,
      },
    })

    // Process each user
    for (const user of activeUsers) {
      try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // Get today's data for the user
        const [tasks, habits, exercises, meals, water, learning] = await Promise.all([
          prisma.task.findMany({
            where: {
              userId: user.id,
              completedAt: {
                gte: today,
              },
            },
          }),
          prisma.habitCompletion.findMany({
            where: {
              habit: {
                userId: user.id,
              },
              completedAt: {
                gte: today,
              },
            },
          }),
          prisma.exercise.findMany({
            where: {
              userId: user.id,
              date: {
                gte: today,
              },
            },
          }),
          prisma.meal.findMany({
            where: {
              userId: user.id,
              date: {
                gte: today,
              },
            },
          }),
          prisma.waterIntake.findMany({
            where: {
              userId: user.id,
              date: {
                gte: today,
              },
            },
          }),
          prisma.learningResource.findMany({
            where: {
              userId: user.id,
              updatedAt: {
                gte: today,
              },
            },
          }),
        ])

        // Calculate scores
        const metricsData = {
          tasksCompleted: tasks.length,
          tasksOnTime: tasks.filter(t => t.dueDate && t.completedAt && t.completedAt <= t.dueDate).length,
          totalTasks: tasks.length,
          habitsCompleted: habits.length,
          totalHabits: habits.length,
          exerciseMinutes: exercises.reduce((sum, e) => sum + e.duration, 0),
          caloriesTracked: meals.length > 0,
          waterGoalMet: water.reduce((sum, w) => sum + w.amount, 0) >= 2000,
          learningMinutes: 0, // TODO: Add learning minutes tracking
        }
        
        const productivityScore = calculateProductivityScore(metricsData)
        const wellnessScore = calculateWellnessScore(metricsData)

        const growthScore = calculateGrowthScore(metricsData)

        // Update or create daily metrics
        await prisma.dailyMetrics.upsert({
          where: {
            userId_date: {
              userId: user.id,
              date: today,
            },
          },
          update: {
            tasksCompleted: tasks.length,
            tasksOnTime: tasks.filter(t => t.dueDate && t.completedAt && t.completedAt <= t.dueDate).length,
            habitsCompleted: habits.length,
            exerciseMinutes: exercises.reduce((sum, e) => sum + e.duration, 0),
            caloriesTracked: meals.length > 0,
            waterGoalMet: water.reduce((sum, w) => sum + w.amount, 0) >= 2000,
            learningMinutes: learning.reduce((sum, l) => sum + l.timeInvested, 0),
            productivityScore,
            wellnessScore,
            growthScore,
          },
          create: {
            userId: user.id,
            date: today,
            tasksCompleted: tasks.length,
            tasksOnTime: tasks.filter(t => t.dueDate && t.completedAt && t.completedAt <= t.dueDate).length,
            habitsCompleted: habits.length,
            exerciseMinutes: exercises.reduce((sum, e) => sum + e.duration, 0),
            caloriesTracked: meals.length > 0,
            waterGoalMet: water.reduce((sum, w) => sum + w.amount, 0) >= 2000,
            learningMinutes: learning.reduce((sum, l) => sum + l.timeInvested, 0),
            productivityScore,
            wellnessScore,
            growthScore,
          },
        })

        // Update user's overall scores
        await prisma.user.update({
          where: { id: user.id },
          data: {
            productivityScore,
            wellnessScore,
            growthScore,
            overallScore: Math.round((productivityScore + wellnessScore + growthScore) / 3),
          },
        })

        results.usersProcessed++
        results.metricsUpdated++
      } catch (error) {
        logger.error('Failed to process user metrics', {
          userId: user.id,
          error,
        })
        results.errors++
      }
    }

    logger.info('Metrics aggregation cron job completed', {
      duration: Date.now() - startTime,
      results,
    })

    return NextResponse.json({
      success: true,
      duration: Date.now() - startTime,
      results,
    })
  } catch (error) {
    logger.error('Metrics aggregation cron job failed', { error })
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      },
      { status: 500 }
    )
  }
}
