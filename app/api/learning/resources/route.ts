import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { learningResourceRepository } from '@/lib/repositories/learning-resource-repository'
import { z } from 'zod'

// Validation schema for learning resource creation
const createLearningResourceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  type: z.enum(['BOOK', 'COURSE', 'CERTIFICATION', 'ARTICLE']),
  category: z.string().min(1, 'Category is required'),
  completionPercentage: z.number().min(0).max(100).default(0),
  timeInvested: z.number().int().min(0).default(0),
  startDate: z.string().datetime(),
  notes: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
})

/**
 * GET /api/learning/resources
 * Get all learning resources for the authenticated user with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    const filters = {
      type: searchParams.get('type') || undefined,
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') as 'IN_PROGRESS' | 'COMPLETED' | 'ALL' | undefined,
      startDate: searchParams.get('startDate') 
        ? new Date(searchParams.get('startDate')!) 
        : undefined,
      endDate: searchParams.get('endDate') 
        ? new Date(searchParams.get('endDate')!) 
        : undefined,
    }

    const resources = await learningResourceRepository.findByUserId(
      session.user.id,
      filters
    )

    return NextResponse.json({ resources })
  } catch (error) {
    console.error('Error fetching learning resources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch learning resources' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/learning/resources
 * Create a new learning resource
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createLearningResourceSchema.parse(body)

    const resource = await learningResourceRepository.create({
      title: validatedData.title,
      type: validatedData.type,
      category: validatedData.category,
      completionPercentage: validatedData.completionPercentage,
      timeInvested: validatedData.timeInvested,
      startDate: new Date(validatedData.startDate),
      notes: validatedData.notes,
      url: validatedData.url || undefined,
      user: {
        connect: { id: session.user.id },
      },
    })

    return NextResponse.json(
      { resource },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating learning resource:', error)
    return NextResponse.json(
      { error: 'Failed to create learning resource' },
      { status: 500 }
    )
  }
}
