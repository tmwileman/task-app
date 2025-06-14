import { TaskWithRelations } from '@/types'
import { format } from 'date-fns'

// Generate iCal format string for tasks
export function generateICalFromTasks(tasks: TaskWithRelations[], calendarName = 'Task App Calendar'): string {
  const now = new Date()
  const timestamp = format(now, "yyyyMMdd'T'HHmmss'Z'")
  
  // iCal header
  let ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Task App//Task Management//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarName}`,
    'X-WR-TIMEZONE:UTC',
  ].join('\r\n')

  // Add events for tasks with due dates
  tasks
    .filter(task => task.dueDate)
    .forEach(task => {
      const dueDate = new Date(task.dueDate!)
      const dtStart = format(dueDate, "yyyyMMdd'T'HHmmss'Z'")
      const dtEnd = format(new Date(dueDate.getTime() + 30 * 60 * 1000), "yyyyMMdd'T'HHmmss'Z'") // 30 min duration
      
      // Generate unique ID for the event
      const uid = `task-${task.id}@taskapp.local`
      
      // Escape special characters for iCal
      const escapeText = (text: string) => 
        text.replace(/\\/g, '\\\\')
            .replace(/;/g, '\\;')
            .replace(/,/g, '\\,')
            .replace(/\n/g, '\\n')
      
      const summary = escapeText(task.title)
      const description = task.description ? escapeText(task.description) : ''
      const priority = getPriorityNumber(task.priority)
      const status = task.completed ? 'COMPLETED' : 'NEEDS-ACTION'
      
      ical += '\r\n' + [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${timestamp}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${summary}`,
        ...(description ? [`DESCRIPTION:${description}`] : []),
        `PRIORITY:${priority}`,
        `STATUS:${status}`,
        ...(task.list ? [`CATEGORIES:${escapeText(task.list.name)}`] : []),
        ...(task.isRecurring ? ['X-TASK-RECURRING:TRUE'] : []),
        ...(task.completed ? [`COMPLETED:${format(task.completedAt || now, "yyyyMMdd'T'HHmmss'Z'")}`] : []),
        'END:VEVENT',
      ].join('\r\n')
    })

  // iCal footer
  ical += '\r\nEND:VCALENDAR'
  
  return ical
}

// Convert priority enum to iCal priority number
function getPriorityNumber(priority: string): number {
  switch (priority) {
    case 'URGENT': return 1 // Highest
    case 'HIGH': return 3
    case 'MEDIUM': return 5 // Normal
    case 'LOW': return 7
    default: return 5
  }
}

// Download iCal file
export function downloadICalFile(tasks: TaskWithRelations[], filename = 'tasks.ics'): void {
  const icalContent = generateICalFromTasks(tasks)
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Generate calendar URL for sharing
export function generateCalendarUrl(tasks: TaskWithRelations[]): string {
  const icalContent = generateICalFromTasks(tasks)
  const encodedContent = encodeURIComponent(icalContent)
  
  // This would typically be served from a URL endpoint
  // For now, return a data URL
  return `data:text/calendar;charset=utf-8,${encodedContent}`
}

// Validate iCal content
export function validateICalContent(content: string): boolean {
  return content.includes('BEGIN:VCALENDAR') && 
         content.includes('END:VCALENDAR') &&
         content.includes('VERSION:2.0')
}