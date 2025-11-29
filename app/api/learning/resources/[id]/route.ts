import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { learningResourceRepository } from '@/lib/repositories/learning-resource-repository'
import { z } from 'zod'

// Validation schema for learning resource updates
const updateLearningResourceSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.enum(['BOOK', 'COURSE', 'CERTIFICATION', 'ARTICLE']).optional(),
  category: z.string().min(1).optional(),
  completionPercentage: z.number().min(0).max(100).optional(),
  timeInvested: z.number().int().min(0).optional(),
  startDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  url: z.string().url().optional().or(z.literal('')),
})

/**
 * GET /api/learning/resources/[id]
 * Get a single learning resource by ID
 */
export async function GET(
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
    const resource = await learningResourceRepository.findById(id, session.user.id)

    if (!resource) {
      return NextResponse.json(
        { error: 'Learning resource not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ resource })
  } catch (error) {
    console.error('Error fetching learning resource:', error)
    return NextResponse.json(
      { error: 'Failed to fetch learning resource' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/learning/resources/[id]
 * Update a learning resource (including progress updates)
 */
export async function PATCH(
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
    const body = await request.json()
    const validatedData = updateLearningResourceSchema.parse(body)

    // Check if resource exists and belongs to user
    const existingResource = await learningResourceRepository.findById(id, session.user.id)
    if (!existingResource) {
      return NextResponse.json(
        { error: 'Learning resource not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.type !== undefined) updateData.type = validatedData.type
    if (validatedData.category !== undefined) updateData.category = validatedData.category
    if (validatedData.startDate !== undefined) {
      updateData.startDate = new Date(validatedData.startDate)
    }
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.url !== undefined) {
      updateData.url = validatedData.url || null
    }

    // Handle progress updates with special logic
    if (validatedData.completionPercentage !== undefined) {
      updateData.completionPercentage = validatedData.completionPercentage
      
      // Mark as completed if reaching 100%
      if (validatedData.completionPercentage >= 100) {
        updateData.completionPercentage = 100
        updateData.completedAt = new Date()
      }
    }

    // Handle time invested updates (additive)
    if (validatedData.timeInvested !== undefined) {
      updateData.timeInvested = existingResource.timeInvested + validatedData.timeInvested
    }

    await learningResourceRepository.update(id, session.user.id, updateData)

    // Fetch updated resource
    const updatedResource = await learningResourceRepository.findById(id, session.user.id)

    if (!updatedResource) {
      return NextResponse.json(
        { error: 'Failed to fetch updated learning resource' },
        { status: 500 }
      )
    }

    return NextResponse.json({ resource: updatedResource })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating learning resource:', error)
    return NextResponse.json(
      { error: 'Failed to update learning resource' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/learning/resources/[id]
 * Delete a learning resource
 */
export async function DELETE(
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

    // Check if resource exists and belongs to user
    const existingResource = await learningResourceRepository.findById(id, session.user.id)
    if (!existingResource) {
      return NextResponse.json(
        { error: 'Learning resource not found' },
        { status: 404 }
      )
    }

    await learningResourceRepository.delete(id, session.user.id)

    return NextResponse.json(
      { message: 'Learning resource deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting learning resource:', error)
    return NextResponse.json(
      { error: 'Failed to delete learning resource' },
      { status: 500 }
    )
  }
}
