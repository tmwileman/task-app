import { format, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns'
import { TaskWithRelations } from '@/types'
import { Priority } from '@prisma/client'

// Calendar event type for React Big Calendar
export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay?: boolean
  resource: TaskWithRelations
}

// Transform tasks into calendar events
export function tasksToCalendarEvents(tasks: TaskWithRelations[]): CalendarEvent[] {
  return tasks
    .filter(task => task.dueDate) // Only tasks with due dates
    .map(task => {
      const dueDate = new Date(task.dueDate!)
      
      return {
        id: task.id,
        title: task.title,
        start: dueDate,
        end: dueDate,
        allDay: false,
        resource: task,
      }
    })
}

// Get task color based on priority and status
export function getTaskEventStyle(task: TaskWithRelations) {
  const baseStyle = {
    borderRadius: '4px',
    border: 'none',
    fontSize: '12px',
    padding: '2px 6px',
  }

  if (task.completed) {
    return {
      ...baseStyle,
      backgroundColor: '#10b981',
      color: 'white',
    }
  }

  // Check if overdue
  const now = new Date()
  const isOverdue = task.dueDate && new Date(task.dueDate) < now

  if (isOverdue) {
    return {
      ...baseStyle,
      backgroundColor: '#ef4444',
      color: 'white',
    }
  }

  // Priority-based colors
  switch (task.priority) {
    case Priority.URGENT:
      return {
        ...baseStyle,
        backgroundColor: '#f97316',
        color: 'white',
      }
    case Priority.HIGH:
      return {
        ...baseStyle,
        backgroundColor: '#eab308',
        color: 'white',
      }
    case Priority.MEDIUM:
      return {
        ...baseStyle,
        backgroundColor: '#3b82f6',
        color: 'white',
      }
    case Priority.LOW:
      return {
        ...baseStyle,
        backgroundColor: '#6b7280',
        color: 'white',
      }
    default:
      return {
        ...baseStyle,
        backgroundColor: '#6b7280',
        color: 'white',
      }
  }
}

// Format date for calendar navigation
export function formatCalendarDate(date: Date): string {
  return format(date, 'MMMM yyyy')
}

// Get tasks for a specific date range
export function getTasksInDateRange(
  tasks: TaskWithRelations[], 
  startDate: Date, 
  endDate: Date
): TaskWithRelations[] {
  return tasks.filter(task => {
    if (!task.dueDate) return false
    
    const taskDate = new Date(task.dueDate)
    return isWithinInterval(taskDate, { start: startDate, end: endDate })
  })
}

// Generate quick date for new tasks
export function createTaskForDate(date: Date) {
  const taskDate = new Date(date)
  // Set time to 9 AM if it's a date selection
  taskDate.setHours(9, 0, 0, 0)
  
  return {
    dueDate: taskDate.toISOString(),
    title: '',
    priority: Priority.MEDIUM,
  }
}