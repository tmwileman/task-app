import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getTasksByUser, getTaskListsByUser } from '@/lib/db-utils'
import { 
  exportToJSON, 
  exportToCSV, 
  exportToICal,
  validateExportOptions,
  generateExportFilename,
  EXPORT_FORMATS,
  type ExportOptions,
  type ExportData
} from '@/lib/data-export'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const options = validateExportOptions(body.options || {})

    // Fetch user's data based on export options
    const tasks = await getTasksByUser(session.user.id, {
      completed: undefined, // Get all tasks
      listId: options.listIds?.[0], // TODO: Support multiple lists
      // TODO: Add date range filtering
      // TODO: Add archived task filtering
    })

    const lists = await getTaskListsByUser(session.user.id)

    // Filter tasks based on options
    let filteredTasks = Array.isArray(tasks) ? tasks : tasks.tasks || []
    
    if (!options.includeCompleted) {
      filteredTasks = filteredTasks.filter(task => !task.completed)
    }

    // TODO: Add archived filtering when implemented
    // if (!options.includeArchived) {
    //   filteredTasks = filteredTasks.filter(task => !task.archived)
    // }

    // Apply date range filter
    if (options.dateRange) {
      const { start, end } = options.dateRange
      filteredTasks = filteredTasks.filter(task => {
        const taskDate = task.dueDate || task.createdAt
        return taskDate >= start && taskDate <= end
      })
    }

    // Apply list filter
    if (options.listIds?.length) {
      filteredTasks = filteredTasks.filter(task => 
        options.listIds!.includes(task.listId || '')
      )
    }

    const exportData: ExportData = {
      tasks: filteredTasks,
      lists: Array.isArray(lists) ? lists : lists.lists || [],
      exportDate: new Date().toISOString(),
      version: '1.0'
    }

    // Generate export content based on format
    let content: string
    let mimeType: string
    let filename: string

    switch (options.format) {
      case 'json':
        content = exportToJSON(exportData)
        mimeType = EXPORT_FORMATS.json.mimeType
        filename = generateExportFilename('json', options)
        break

      case 'csv':
        content = exportToCSV(filteredTasks)
        mimeType = EXPORT_FORMATS.csv.mimeType
        filename = generateExportFilename('csv', options)
        break

      case 'ical':
        content = exportToICal(filteredTasks, session.user.email || 'user@task-app.com')
        mimeType = EXPORT_FORMATS.ical.mimeType
        filename = generateExportFilename('ics', options)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid export format' },
          { status: 400 }
        )
    }

    // Return the file content with appropriate headers
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(content, 'utf8').toString(),
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

// GET endpoint for export options and metadata
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's lists for export options
    const lists = await getTaskListsByUser(session.user.id)
    const userLists = Array.isArray(lists) ? lists : lists.lists || []

    // Get task counts for different categories
    const allTasks = await getTasksByUser(session.user.id, {})
    const tasksArray = Array.isArray(allTasks) ? allTasks : allTasks.tasks || []

    const stats = {
      totalTasks: tasksArray.length,
      completedTasks: tasksArray.filter(t => t.completed).length,
      pendingTasks: tasksArray.filter(t => !t.completed).length,
      totalLists: userLists.length,
      tasksWithDueDates: tasksArray.filter(t => t.dueDate).length,
      recurringTasks: tasksArray.filter(t => t.isRecurring).length,
    }

    return NextResponse.json({
      formats: EXPORT_FORMATS,
      lists: userLists.map(list => ({
        id: list.id,
        name: list.name,
        taskCount: tasksArray.filter(t => t.listId === list.id).length
      })),
      stats,
      dateRange: {
        earliest: tasksArray.length > 0 
          ? Math.min(...tasksArray.map(t => new Date(t.createdAt).getTime()))
          : Date.now(),
        latest: tasksArray.length > 0
          ? Math.max(...tasksArray.map(t => new Date(t.createdAt).getTime()))
          : Date.now()
      }
    })
  } catch (error) {
    console.error('Error fetching export metadata:', error)
    return NextResponse.json(
      { error: 'Failed to fetch export options' },
      { status: 500 }
    )
  }
}