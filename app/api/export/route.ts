import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { exportService, ExportFormat } from '@/lib/integrations/export-service'

/**
 * GET /api/export
 * Export user data in various formats (CSV, JSON, PDF)
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
    const format = (searchParams.get('format')?.toUpperCase() || 'JSON') as ExportFormat
    const entitiesParam = searchParams.get('entities')
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    // Validate format
    if (!['CSV', 'JSON', 'PDF'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Supported formats: CSV, JSON, PDF' },
        { status: 400 }
      )
    }

    // Parse entities
    const entities = entitiesParam
      ? entitiesParam.split(',').map(e => e.trim())
      : undefined

    // Parse dates
    const startDate = startDateParam ? new Date(startDateParam) : undefined
    const endDate = endDateParam ? new Date(endDateParam) : undefined

    // Validate dates
    if (startDate && isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid startDate format' },
        { status: 400 }
      )
    }

    if (endDate && isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid endDate format' },
        { status: 400 }
      )
    }

    // Export data
    const exportData = await exportService.exportData({
      userId: session.user.id,
      format,
      entities,
      startDate,
      endDate,
    })

    // Get filename and content type
    const filename = exportService.getExportFilename(format, session.user.id)
    const contentType = exportService.getContentType(format)

    // Return file
    const body = typeof exportData === 'string' 
      ? exportData 
      : Buffer.isBuffer(exportData) 
        ? exportData.toString() 
        : exportData

    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting data:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
