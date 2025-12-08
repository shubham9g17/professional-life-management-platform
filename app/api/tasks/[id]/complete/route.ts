import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { taskRepository } from '@/lib/repositories/task-repository'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/tasks/[id]/complete
 * Mark a task as completed and update productivity metrics
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Check if task exists and belongs to user
    const existingTask = await taskRepository.findById(id, session.user.id)
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if task is already completed
    if (existingTask.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Task is already completed' },
        { status: 400 }
      )
    }

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Mark task as completed
      await tx.task.updateMany({
        where: {
          id,
          userId: session.user.id,
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          updatedAt: new Date(),
        },
      })

      // Get today's date at midnight for metrics
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Check if task was completed on time
      const wasOnTime = !existingTask.dueDate || new Date() <= existingTask.dueDate

      // Update or create daily metrics
      const existingMetrics = await tx.dailyMetrics.findUnique({
        where: {
          userId_date: {
            userId: session.user.id,
            date: today,
          },
        },
      })

      if (existingMetrics) {
        // Update existing metrics
        await tx.dailyMetrics.update({
          where: {
            userId_date: {
              userId: session.user.id,
              date: today,
            },
          },
          data: {
            tasksCompleted: existingMetrics.tasksCompleted + 1,
            tasksOnTime: wasOnTime 
              ? existingMetrics.tasksOnTime + 1 
              : existingMetrics.tasksOnTime,
          },
        })
      } else {
        // Create new metrics for today
        await tx.dailyMetrics.create({
          data: {
            userId: session.user.id,
            date: today,
            tasksCompleted: 1,
            tasksOnTime: wasOnTime ? 1 : 0,
          },
        })
      }

      // Calculate and update user's productivity score
      // Get tasks completed in the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const recentMetrics = await tx.dailyMetrics.findMany({
        where: {
          userId: session.user.id,
          date: {
            gte: thirtyDaysAgo,
          },
        },
      })

      // Calculate productivity score (0-100)
      // Based on: completion rate, on-time rate, and consistency
      const totalCompleted = recentMetrics.reduce((sum, m) => sum + m.tasksCompleted, 0)
      const totalOnTime = recentMetrics.reduce((sum, m) => sum + m.tasksOnTime, 0)
      const daysActive = recentMetrics.filter(m => m.tasksCompleted > 0).length

      const completionScore = Math.min(totalCompleted * 2, 40) // Max 40 points
      const onTimeRate = totalCompleted > 0 ? (totalOnTime / totalCompleted) * 30 : 0 // Max 30 points
      const consistencyScore = Math.min(daysActive * 1, 30) // Max 30 points

      const productivityScore = Math.round(completionScore + onTimeRate + consistencyScore)

      // Update user's productivity score
      await tx.user.update({
        where: { id: session.user.id },
        data: { productivityScore },
      })

      // Fetch the updated task
      const updatedTask = await tx.task.findUnique({
        where: { id },
      })

      return updatedTask
    })

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to complete task' },
        { status: 500 }
      )
    }

    // Parse tags back to array for response
    const taskWithParsedTags = {
      ...result,
      tags: result.tags ? JSON.parse(result.tags) : [],
    }

    return NextResponse.json({ 
      task: taskWithParsedTags,
      message: 'Task completed successfully and metrics updated'
    })
  } catch (error) {
    console.error('Error completing task:', error)
    return NextResponse.json(
      { error: 'Failed to complete task' },
      { status: 500 }
    )
  }
}
