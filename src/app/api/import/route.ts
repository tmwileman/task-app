import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createTask, createTaskList, getTaskListsByUser, getTasksByUser } from '@/lib/db-utils'
import { 
  parseCSV, 
  parseJSON, 
  parseTodoist, 
  parseAnyDo,
  detectFormat,
  validateImportTasks,
  DEFAULT_IMPORT_OPTIONS,
  type ImportTask,
  type ImportOptions,
  type ImportResult
} from '@/lib/data-import'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const optionsStr = formData.get('options') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const options: ImportOptions = optionsStr 
      ? { ...DEFAULT_IMPORT_OPTIONS, ...JSON.parse(optionsStr) }
      : DEFAULT_IMPORT_OPTIONS

    // Read file content
    const content = await file.text()
    const format = detectFormat(content, file.name)

    if (format === 'unknown') {
      return NextResponse.json({ 
        error: 'Unsupported file format. Please upload CSV or JSON files.' 
      }, { status: 400 })
    }

    // Parse tasks based on format
    let tasks: ImportTask[] = []
    try {
      switch (format) {
        case 'csv':
          tasks = parseCSV(content)
          break
        case 'json':
          tasks = parseJSON(content)
          break
        case 'todoist':
          tasks = parseTodoist(content)
          break
        case 'anydo':
          tasks = parseAnyDo(content)
          break
        default:
          throw new Error('Unsupported format')
      }
    } catch (error) {
      return NextResponse.json({ 
        error: `Failed to parse ${format.toUpperCase()} file: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }, { status: 400 })
    }

    // Validate tasks
    const { valid: validTasks, errors: validationErrors } = validateImportTasks(tasks)

    if (validTasks.length === 0) {
      return NextResponse.json({ 
        error: 'No valid tasks found in file',
        details: validationErrors
      }, { status: 400 })
    }

    // Get existing data for duplicate checking and list creation
    const existingLists = await getTaskListsByUser(session.user.id)
    const existingListsArray = Array.isArray(existingLists) ? existingLists : existingLists.lists || []
    
    const existingTasks = options.skipDuplicates 
      ? await getTasksByUser(session.user.id, {})
      : null
    const existingTasksArray = existingTasks 
      ? (Array.isArray(existingTasks) ? existingTasks : existingTasks.tasks || [])
      : []

    // Process imports
    const result: ImportResult = {
      success: true,
      tasksImported: 0,
      listsCreated: 0,
      errors: [...validationErrors],
      warnings: []
    }

    // Track created lists to avoid duplicates
    const createdLists = new Map<string, string>() // name -> id
    existingListsArray.forEach(list => createdLists.set(list.name.toLowerCase(), list.id))

    // Import tasks
    for (const task of validTasks) {
      try {
        // Skip duplicates if option is enabled
        if (options.skipDuplicates && existingTasksArray.some(
          existing => existing.title.toLowerCase() === task.title.toLowerCase()
        )) {
          result.warnings.push(`Skipped duplicate task: "${task.title}"`)
          continue
        }

        // Handle list assignment
        let listId: string | undefined = undefined
        
        if (task.listName) {
          const listNameLower = task.listName.toLowerCase()
          
          if (createdLists.has(listNameLower)) {
            listId = createdLists.get(listNameLower)
          } else if (options.createMissingLists) {
            // Create new list
            try {
              const newList = await createTaskList({
                name: task.listName,
                userId: session.user.id,
                description: `Imported from ${format.toUpperCase()} file`,
                color: '#3B82F6' // Default blue
              })
              
              createdLists.set(listNameLower, newList.id)
              listId = newList.id
              result.listsCreated++
            } catch (error) {
              result.warnings.push(`Failed to create list "${task.listName}" for task "${task.title}"`)
            }
          } else {
            result.warnings.push(`List "${task.listName}" not found for task "${task.title}"`)
          }
        } else if (options.defaultList) {
          const defaultListLower = options.defaultList.toLowerCase()
          if (createdLists.has(defaultListLower)) {
            listId = createdLists.get(defaultListLower)
          }
        }

        // Create the task
        const newTask = await createTask({
          title: task.title,
          description: task.description,
          priority: task.priority || options.defaultPriority,
          dueDate: task.dueDate,
          completed: task.completed || false,
          listId,
          userId: session.user.id
        })

        result.tasksImported++

        // TODO: Handle subtasks when subtask creation is available
        if (task.subtasks?.length) {
          result.warnings.push(`Subtasks for "${task.title}" not imported (feature coming soon)`)
        }

        // TODO: Handle tags when tag system is available
        if (task.tags?.length) {
          result.warnings.push(`Tags for "${task.title}" not imported (feature coming soon)`)
        }

      } catch (error) {
        const errorMsg = `Failed to import task "${task.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
        result.errors.push(errorMsg)
      }
    }

    // Determine overall success
    result.success = result.tasksImported > 0

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error importing data:', error)
    return NextResponse.json(
      { error: 'Failed to import data' },
      { status: 500 }
    )
  }
}

// GET endpoint for import information
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's existing lists for import options
    const lists = await getTaskListsByUser(session.user.id)
    const userLists = Array.isArray(lists) ? lists : lists.lists || []

    return NextResponse.json({
      supportedFormats: [
        {
          id: 'csv',
          name: 'CSV',
          description: 'Comma-separated values file (Excel compatible)',
          extensions: ['.csv'],
          examples: ['Exported from Excel, Google Sheets, or other task apps']
        },
        {
          id: 'json',
          name: 'JSON',
          description: 'JavaScript Object Notation (our own export format)',
          extensions: ['.json'],
          examples: ['Task App export, generic JSON task files']
        },
        {
          id: 'todoist',
          name: 'Todoist',
          description: 'Todoist backup format',
          extensions: ['.json'],
          examples: ['Todoist account backup/export files']
        },
        {
          id: 'anydo',
          name: 'Any.do',
          description: 'Any.do export format',
          extensions: ['.json'],
          examples: ['Any.do backup files']
        }
      ],
      defaultOptions: DEFAULT_IMPORT_OPTIONS,
      existingLists: userLists.map(list => ({
        id: list.id,
        name: list.name
      })),
      csvTemplate: {
        headers: ['Title', 'Description', 'Priority', 'Due Date', 'Status', 'List', 'Tags'],
        example: [
          'Complete project proposal',
          'Write and review the Q4 project proposal document',
          'High',
          '2024-12-31',
          'Pending',
          'Work',
          'urgent,proposal'
        ]
      }
    })
  } catch (error) {
    console.error('Error fetching import info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch import information' },
      { status: 500 }
    )
  }
}