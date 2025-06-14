import { TaskWithRelations, TaskListWithRelations } from '@/types'

export interface ExportData {
  tasks: TaskWithRelations[]
  lists: TaskListWithRelations[]
  exportDate: string
  version: string
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'ical'
  includeCompleted: boolean
  includeArchived: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  listIds?: string[]
}

// JSON Export
export function exportToJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2)
}

// CSV Export
export function exportToCSV(tasks: TaskWithRelations[]): string {
  const headers = [
    'Title',
    'Description',
    'Status',
    'Priority',
    'Due Date',
    'Created Date',
    'Completed Date',
    'List',
    'Tags',
    'Subtasks Count',
    'Recurring'
  ]

  const rows = tasks.map(task => [
    escapeCSV(task.title),
    escapeCSV(task.description || ''),
    task.completed ? 'Completed' : 'Pending',
    task.priority,
    task.dueDate ? new Date(task.dueDate).toISOString() : '',
    new Date(task.createdAt).toISOString(),
    task.completedAt ? new Date(task.completedAt).toISOString() : '',
    escapeCSV(task.list?.name || 'No List'),
    escapeCSV(task.tags?.map(t => t.tag.name).join(', ') || ''),
    task.subtasks?.length || 0,
    task.isRecurring ? 'Yes' : 'No'
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  return csvContent
}

// Helper function to escape CSV values
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

// iCal Export (extending existing functionality)
export function exportToICal(tasks: TaskWithRelations[], userEmail: string): string {
  const now = new Date()
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  }

  const events = tasks
    .filter(task => task.dueDate)
    .map(task => {
      const dueDate = new Date(task.dueDate!)
      const startDate = new Date(dueDate.getTime() - (60 * 60 * 1000)) // 1 hour before due
      
      return [
        'BEGIN:VEVENT',
        `UID:task-${task.id}@task-app`,
        `DTSTAMP:${formatDate(now)}`,
        `DTSTART:${formatDate(startDate)}`,
        `DTEND:${formatDate(dueDate)}`,
        `SUMMARY:${task.title}`,
        task.description ? `DESCRIPTION:${task.description.replace(/\n/g, '\\n')}` : '',
        `STATUS:${task.completed ? 'COMPLETED' : 'NEEDS-ACTION'}`,
        `PRIORITY:${getPriorityNumber(task.priority)}`,
        task.list ? `CATEGORIES:${task.list.name}` : '',
        task.tags?.length ? `CATEGORIES:${task.tags.map(t => t.tag.name).join(',')}` : '',
        'END:VEVENT'
      ].filter(Boolean).join('\r\n')
    })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Task App//Task Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR'
  ].join('\r\n')
}

function getPriorityNumber(priority: string): number {
  switch (priority) {
    case 'URGENT': return 1
    case 'HIGH': return 3
    case 'MEDIUM': return 5
    case 'LOW': return 7
    default: return 5
  }
}

// Comprehensive data preparation
export async function prepareExportData(
  userId: string,
  options: ExportOptions
): Promise<ExportData> {
  // This would typically call the database utilities
  // For now, we'll structure the API call
  const params = new URLSearchParams({
    userId,
    includeCompleted: options.includeCompleted.toString(),
    includeArchived: options.includeArchived.toString(),
  })

  if (options.dateRange) {
    params.set('startDate', options.dateRange.start.toISOString())
    params.set('endDate', options.dateRange.end.toISOString())
  }

  if (options.listIds?.length) {
    params.set('listIds', options.listIds.join(','))
  }

  // This will be called from the API route
  return {
    tasks: [], // Will be populated by API
    lists: [], // Will be populated by API
    exportDate: new Date().toISOString(),
    version: '1.0'
  }
}

// Generate filename for export
export function generateExportFilename(format: string, options: ExportOptions): string {
  const timestamp = new Date().toISOString().split('T')[0]
  const scope = options.listIds?.length 
    ? `lists-${options.listIds.length}` 
    : 'all-tasks'
  
  return `task-app-export-${scope}-${timestamp}.${format}`
}

// File download helper
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// Export format configurations
export const EXPORT_FORMATS = {
  json: {
    name: 'JSON',
    description: 'Complete data export with all task information',
    mimeType: 'application/json',
    extension: 'json'
  },
  csv: {
    name: 'CSV',
    description: 'Spreadsheet-friendly format for data analysis',
    mimeType: 'text/csv',
    extension: 'csv'
  },
  ical: {
    name: 'iCal',
    description: 'Calendar format for importing into calendar apps',
    mimeType: 'text/calendar',
    extension: 'ics'
  }
} as const

// Validate export options
export function validateExportOptions(options: Partial<ExportOptions>): ExportOptions {
  return {
    format: options.format || 'json',
    includeCompleted: options.includeCompleted ?? true,
    includeArchived: options.includeArchived ?? false,
    dateRange: options.dateRange,
    listIds: options.listIds
  }
}