import {
  exportToJSON,
  exportToCSV,
  exportToICal,
  generateExportFilename,
  validateExportOptions,
  EXPORT_FORMATS
} from '@/lib/data-export'
import { TaskWithRelations, TaskListWithRelations } from '@/types'

// Mock data
const mockTask: TaskWithRelations = {
  id: '1',
  title: 'Test Task',
  description: 'Test description',
  completed: false,
  priority: 'HIGH',
  dueDate: new Date('2024-01-15T10:00:00Z'),
  createdAt: new Date('2024-01-01T00:00:00Z'),
  completedAt: null,
  userId: 'user1',
  listId: 'list1',
  parentId: null,
  isRecurring: false,
  archived: false,
  archivedAt: null,
  list: {
    id: 'list1',
    name: 'Work Tasks',
    userId: 'user1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    tasks: []
  },
  subtasks: [],
  tags: [
    {
      id: '1',
      taskId: '1',
      tagId: 'tag1',
      tag: {
        id: 'tag1',
        name: 'urgent',
        userId: 'user1',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        tasks: []
      }
    }
  ]
}

const mockList: TaskListWithRelations = {
  id: 'list1',
  name: 'Work Tasks',
  userId: 'user1',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  tasks: [mockTask]
}

const mockExportData = {
  tasks: [mockTask],
  lists: [mockList],
  exportDate: '2024-01-15T12:00:00Z',
  version: '1.0'
}

describe('Data Export Functions', () => {
  describe('exportToJSON', () => {
    it('should export data to properly formatted JSON', () => {
      const result = exportToJSON(mockExportData)
      
      expect(typeof result).toBe('string')
      expect(() => JSON.parse(result)).not.toThrow()
      
      const parsed = JSON.parse(result)
      expect(parsed.tasks).toHaveLength(1)
      expect(parsed.lists).toHaveLength(1)
      expect(parsed.exportDate).toBe('2024-01-15T12:00:00Z')
      expect(parsed.version).toBe('1.0')
    })

    it('should preserve all task properties', () => {
      const result = exportToJSON(mockExportData)
      const parsed = JSON.parse(result)
      const task = parsed.tasks[0]
      
      expect(task.id).toBe('1')
      expect(task.title).toBe('Test Task')
      expect(task.description).toBe('Test description')
      expect(task.priority).toBe('HIGH')
      expect(task.completed).toBe(false)
    })
  })

  describe('exportToCSV', () => {
    it('should export tasks to CSV format with headers', () => {
      const result = exportToCSV([mockTask])
      const lines = result.split('\n')
      
      expect(lines[0]).toContain('Title,Description,Status,Priority')
      expect(lines[1]).toContain('Test Task,Test description,Pending,HIGH')
    })

    it('should handle tasks without optional fields', () => {
      const taskWithoutOptionals = {
        ...mockTask,
        description: null,
        dueDate: null,
        completedAt: null,
        list: null,
        tags: []
      }
      
      const result = exportToCSV([taskWithoutOptionals])
      expect(result).toContain('Test Task,,Pending,HIGH')
    })

    it('should escape CSV special characters', () => {
      const taskWithSpecialChars = {
        ...mockTask,
        title: 'Task with "quotes" and, commas',
        description: 'Description with\nnewlines'
      }
      
      const result = exportToCSV([taskWithSpecialChars])
      expect(result).toContain('"Task with ""quotes"" and, commas"')
      expect(result).toContain('"Description with\nnewlines"')
    })

    it('should handle multiple tasks', () => {
      const task2 = { ...mockTask, id: '2', title: 'Second Task' }
      const result = exportToCSV([mockTask, task2])
      const lines = result.split('\n')
      
      expect(lines).toHaveLength(3) // header + 2 tasks
      expect(lines[1]).toContain('Test Task')
      expect(lines[2]).toContain('Second Task')
    })
  })

  describe('exportToICal', () => {
    it('should generate valid iCal format', () => {
      const result = exportToICal([mockTask], 'user@example.com')
      
      expect(result).toContain('BEGIN:VCALENDAR')
      expect(result).toContain('END:VCALENDAR')
      expect(result).toContain('BEGIN:VEVENT')
      expect(result).toContain('END:VEVENT')
      expect(result).toContain('VERSION:2.0')
    })

    it('should include task details in events', () => {
      const result = exportToICal([mockTask], 'user@example.com')
      
      expect(result).toContain('SUMMARY:Test Task')
      expect(result).toContain('DESCRIPTION:Test description')
      expect(result).toContain('STATUS:NEEDS-ACTION')
      expect(result).toContain('PRIORITY:3') // HIGH priority = 3
    })

    it('should handle completed tasks', () => {
      const completedTask = { ...mockTask, completed: true }
      const result = exportToICal([completedTask], 'user@example.com')
      
      expect(result).toContain('STATUS:COMPLETED')
    })

    it('should filter out tasks without due dates', () => {
      const taskWithoutDue = { ...mockTask, dueDate: null }
      const result = exportToICal([taskWithoutDue], 'user@example.com')
      
      expect(result).not.toContain('SUMMARY:Test Task')
      expect(result).toContain('BEGIN:VCALENDAR')
      expect(result).toContain('END:VCALENDAR')
    })

    it('should include categories from list and tags', () => {
      const result = exportToICal([mockTask], 'user@example.com')
      
      expect(result).toContain('CATEGORIES:Work Tasks')
      expect(result).toContain('CATEGORIES:urgent')
    })
  })

  describe('generateExportFilename', () => {
    beforeAll(() => {
      // Mock Date.now() for consistent filename generation
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'))
    })

    afterAll(() => {
      jest.useRealTimers()
    })

    it('should generate filename with correct format and timestamp', () => {
      const options = {
        format: 'json' as const,
        includeCompleted: true,
        includeArchived: false
      }
      
      const filename = generateExportFilename('json', options)
      expect(filename).toBe('task-app-export-all-tasks-2024-01-15.json')
    })

    it('should include list scope when specific lists are selected', () => {
      const options = {
        format: 'csv' as const,
        includeCompleted: true,
        includeArchived: false,
        listIds: ['list1', 'list2']
      }
      
      const filename = generateExportFilename('csv', options)
      expect(filename).toBe('task-app-export-lists-2-2024-01-15.csv')
    })
  })

  describe('validateExportOptions', () => {
    it('should provide default values for missing options', () => {
      const result = validateExportOptions({})
      
      expect(result.format).toBe('json')
      expect(result.includeCompleted).toBe(true)
      expect(result.includeArchived).toBe(false)
      expect(result.dateRange).toBeUndefined()
      expect(result.listIds).toBeUndefined()
    })

    it('should preserve provided options', () => {
      const options = {
        format: 'csv' as const,
        includeCompleted: false,
        includeArchived: true,
        listIds: ['list1']
      }
      
      const result = validateExportOptions(options)
      
      expect(result.format).toBe('csv')
      expect(result.includeCompleted).toBe(false)
      expect(result.includeArchived).toBe(true)
      expect(result.listIds).toEqual(['list1'])
    })

    it('should handle partial options', () => {
      const result = validateExportOptions({ format: 'ical' })
      
      expect(result.format).toBe('ical')
      expect(result.includeCompleted).toBe(true)
      expect(result.includeArchived).toBe(false)
    })
  })

  describe('EXPORT_FORMATS', () => {
    it('should have all required format configurations', () => {
      expect(EXPORT_FORMATS.json).toBeDefined()
      expect(EXPORT_FORMATS.csv).toBeDefined()
      expect(EXPORT_FORMATS.ical).toBeDefined()
    })

    it('should have proper MIME types', () => {
      expect(EXPORT_FORMATS.json.mimeType).toBe('application/json')
      expect(EXPORT_FORMATS.csv.mimeType).toBe('text/csv')
      expect(EXPORT_FORMATS.ical.mimeType).toBe('text/calendar')
    })

    it('should have correct file extensions', () => {
      expect(EXPORT_FORMATS.json.extension).toBe('json')
      expect(EXPORT_FORMATS.csv.extension).toBe('csv')
      expect(EXPORT_FORMATS.ical.extension).toBe('ics')
    })
  })
})