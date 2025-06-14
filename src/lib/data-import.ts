import { Priority } from '@prisma/client'

export interface ImportTask {
  title: string
  description?: string
  priority: Priority
  dueDate?: Date
  completed: boolean
  listName?: string
  tags?: string[]
  subtasks?: string[]
}

export interface ImportResult {
  success: boolean
  tasksImported: number
  listsCreated: number
  errors: string[]
  warnings: string[]
}

export interface ImportOptions {
  createMissingLists: boolean
  skipDuplicates: boolean
  defaultList?: string
  defaultPriority: Priority
}

// Parse CSV data
export function parseCSV(csvContent: string): ImportTask[] {
  const lines = csvContent.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const tasks: ImportTask[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVRow(lines[i])
    if (values.length === 0) continue

    const task: ImportTask = {
      title: '',
      priority: Priority.MEDIUM,
      completed: false
    }

    headers.forEach((header, index) => {
      const value = values[index]?.trim().replace(/"/g, '') || ''
      
      switch (header.toLowerCase()) {
        case 'title':
        case 'task':
        case 'name':
          task.title = value
          break
        case 'description':
        case 'notes':
        case 'details':
          task.description = value || undefined
          break
        case 'priority':
          task.priority = parsePriority(value)
          break
        case 'due date':
        case 'due_date':
        case 'duedate':
          task.dueDate = parseDate(value)
          break
        case 'status':
        case 'completed':
        case 'done':
          task.completed = parseBoolean(value)
          break
        case 'list':
        case 'project':
        case 'category':
          task.listName = value || undefined
          break
        case 'tags':
        case 'labels':
          task.tags = value ? value.split(',').map(t => t.trim()).filter(Boolean) : undefined
          break
        case 'subtasks':
          task.subtasks = value ? value.split(',').map(t => t.trim()).filter(Boolean) : undefined
          break
      }
    })

    if (task.title) {
      tasks.push(task)
    }
  }

  return tasks
}

// Parse CSV row handling quoted values
function parseCSVRow(row: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i]
    
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}

// Parse JSON data
export function parseJSON(jsonContent: string): ImportTask[] {
  try {
    const data = JSON.parse(jsonContent)
    
    // Handle our own export format
    if (data.tasks && Array.isArray(data.tasks)) {
      return data.tasks.map(mapTaskFromJSON)
    }
    
    // Handle array of tasks
    if (Array.isArray(data)) {
      return data.map(mapTaskFromJSON)
    }
    
    // Handle single task
    if (data.title || data.name) {
      return [mapTaskFromJSON(data)]
    }
    
    return []
  } catch (error) {
    throw new Error('Invalid JSON format')
  }
}

function mapTaskFromJSON(item: any): ImportTask {
  return {
    title: item.title || item.name || '',
    description: item.description || item.notes || undefined,
    priority: parsePriority(item.priority),
    dueDate: parseDate(item.dueDate || item.due_date || item.due),
    completed: parseBoolean(item.completed || item.done || item.status),
    listName: item.listName || item.list || item.project || item.category || undefined,
    tags: Array.isArray(item.tags) ? item.tags : 
          typeof item.tags === 'string' ? item.tags.split(',').map(t => t.trim()) : undefined,
    subtasks: Array.isArray(item.subtasks) ? item.subtasks :
             typeof item.subtasks === 'string' ? item.subtasks.split(',').map(t => t.trim()) : undefined
  }
}

// Parse Todoist format
export function parseTodoist(jsonContent: string): ImportTask[] {
  try {
    const data = JSON.parse(jsonContent)
    const tasks: ImportTask[] = []
    
    // Todoist export format
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((item: any) => {
        tasks.push({
          title: item.content || '',
          description: item.description || undefined,
          priority: mapTodoistPriority(item.priority),
          dueDate: item.due?.date ? parseDate(item.due.date) : undefined,
          completed: item.checked === 1,
          listName: item.project_id ? findTodoistProject(data.projects, item.project_id) : undefined,
          tags: item.labels ? item.labels.map((l: any) => l.name) : undefined
        })
      })
    }
    
    return tasks
  } catch (error) {
    throw new Error('Invalid Todoist format')
  }
}

function findTodoistProject(projects: any[], projectId: number): string | undefined {
  const project = projects?.find(p => p.id === projectId)
  return project?.name
}

function mapTodoistPriority(priority: number): Priority {
  switch (priority) {
    case 4: return Priority.URGENT
    case 3: return Priority.HIGH
    case 2: return Priority.MEDIUM
    default: return Priority.LOW
  }
}

// Parse Any.do format
export function parseAnyDo(jsonContent: string): ImportTask[] {
  try {
    const data = JSON.parse(jsonContent)
    const tasks: ImportTask[] = []
    
    if (data.tasks && Array.isArray(data.tasks)) {
      data.tasks.forEach((item: any) => {
        tasks.push({
          title: item.title || '',
          description: item.note || undefined,
          priority: item.priority ? parsePriority(item.priority) : Priority.MEDIUM,
          dueDate: item.dueDate ? parseDate(item.dueDate) : undefined,
          completed: item.status === 'DONE',
          listName: item.categoryId ? findAnyDoCategory(data.categories, item.categoryId) : undefined
        })
      })
    }
    
    return tasks
  } catch (error) {
    throw new Error('Invalid Any.do format')
  }
}

function findAnyDoCategory(categories: any[], categoryId: string): string | undefined {
  const category = categories?.find(c => c.id === categoryId)
  return category?.name
}

// Utility functions
function parsePriority(value: string | number): Priority {
  if (typeof value === 'number') {
    if (value >= 4) return Priority.URGENT
    if (value >= 3) return Priority.HIGH
    if (value >= 2) return Priority.MEDIUM
    return Priority.LOW
  }
  
  const str = String(value).toLowerCase()
  if (str.includes('urgent') || str.includes('critical') || str === '4') return Priority.URGENT
  if (str.includes('high') || str === '3') return Priority.HIGH
  if (str.includes('medium') || str.includes('normal') || str === '2') return Priority.MEDIUM
  return Priority.LOW
}

function parseDate(value: string | Date | number | null | undefined): Date | undefined {
  if (!value) return undefined
  
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value)
  
  const str = String(value).trim()
  if (!str) return undefined
  
  // Try parsing various date formats
  const date = new Date(str)
  return isNaN(date.getTime()) ? undefined : date
}

function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  
  const str = String(value).toLowerCase().trim()
  return ['true', '1', 'yes', 'done', 'completed', 'finished'].includes(str)
}

// Detect file format
export function detectFormat(content: string, filename?: string): 'csv' | 'json' | 'todoist' | 'anydo' | 'unknown' {
  // Check file extension
  if (filename) {
    const ext = filename.toLowerCase().split('.').pop()
    if (ext === 'csv') return 'csv'
    if (ext === 'json') return 'json'
  }
  
  // Try to parse as JSON
  try {
    const data = JSON.parse(content)
    
    // Check for Todoist format
    if (data.items && data.projects) return 'todoist'
    
    // Check for Any.do format
    if (data.tasks && data.categories) return 'anydo'
    
    // Check for our format
    if (data.tasks && data.lists && data.version) return 'json'
    
    return 'json'
  } catch {
    // Not JSON, check if it looks like CSV
    const lines = content.split('\n').filter(l => l.trim())
    if (lines.length > 1 && lines[0].includes(',')) {
      return 'csv'
    }
  }
  
  return 'unknown'
}

// Validate import data
export function validateImportTasks(tasks: ImportTask[]): { valid: ImportTask[], errors: string[] } {
  const valid: ImportTask[] = []
  const errors: string[] = []
  
  tasks.forEach((task, index) => {
    if (!task.title?.trim()) {
      errors.push(`Row ${index + 1}: Task title is required`)
      return
    }
    
    if (task.title.length > 500) {
      errors.push(`Row ${index + 1}: Task title is too long (max 500 characters)`)
      return
    }
    
    if (task.description && task.description.length > 2000) {
      errors.push(`Row ${index + 1}: Task description is too long (max 2000 characters)`)
      return
    }
    
    valid.push(task)
  })
  
  return { valid, errors }
}

// Default import options
export const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  createMissingLists: true,
  skipDuplicates: true,
  defaultPriority: Priority.MEDIUM
}