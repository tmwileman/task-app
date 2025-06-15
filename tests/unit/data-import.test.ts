import {
  parseCSV,
  parseJSON,
  parseTodoist,
  parseAnyDo,
  detectFormat,
  validateImportTasks,
  DEFAULT_IMPORT_OPTIONS
} from '@/lib/data-import'
import { Priority } from '@prisma/client'

describe('Data Import Functions', () => {
  describe('parseCSV', () => {
    it('should parse basic CSV with headers', () => {
      const csvContent = `title,description,priority,status
Task 1,First task,HIGH,completed
Task 2,Second task,MEDIUM,pending`

      const result = parseCSV(csvContent)
      
      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('Task 1')
      expect(result[0].description).toBe('First task')
      expect(result[0].priority).toBe(Priority.HIGH)
      expect(result[0].completed).toBe(true)
      
      expect(result[1].title).toBe('Task 2')
      expect(result[1].completed).toBe(false)
    })

    it('should handle different header variations', () => {
      const csvContent = `name,notes,due_date,done
Test Task,Some notes,2024-01-15,yes`

      const result = parseCSV(csvContent)
      
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Test Task')
      expect(result[0].description).toBe('Some notes')
      expect(result[0].dueDate).toEqual(new Date('2024-01-15'))
      expect(result[0].completed).toBe(true)
    })

    it('should handle quoted CSV values with commas', () => {
      const csvContent = `title,description
"Task with, comma","Description with ""quotes"""
Regular Task,Simple description`

      const result = parseCSV(csvContent)
      
      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('Task with, comma')
      expect(result[0].description).toBe('Description with "quotes"')
      expect(result[1].title).toBe('Regular Task')
    })

    it('should parse tags and subtasks from comma-separated values', () => {
      const csvContent = `title,tags,subtasks
Main Task,"urgent,work","Subtask 1,Subtask 2"`

      const result = parseCSV(csvContent)
      
      expect(result[0].tags).toEqual(['urgent', 'work'])
      expect(result[0].subtasks).toEqual(['Subtask 1', 'Subtask 2'])
    })

    it('should skip rows without titles', () => {
      const csvContent = `title,description
,No title task
Valid Task,Has title
,Another no title`

      const result = parseCSV(csvContent)
      
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Valid Task')
    })

    it('should handle empty CSV', () => {
      expect(parseCSV('')).toEqual([])
      expect(parseCSV('\n\n')).toEqual([])
    })
  })

  describe('parseJSON', () => {
    it('should parse our export format', () => {
      const jsonContent = JSON.stringify({
        tasks: [
          {
            title: 'Test Task',
            description: 'Test description',
            priority: 'HIGH',
            completed: false,
            dueDate: '2024-01-15T10:00:00Z'
          }
        ],
        lists: [],
        version: '1.0'
      })

      const result = parseJSON(jsonContent)
      
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Test Task')
      expect(result[0].priority).toBe(Priority.HIGH)
      expect(result[0].dueDate).toEqual(new Date('2024-01-15T10:00:00Z'))
    })

    it('should parse array of tasks', () => {
      const jsonContent = JSON.stringify([
        { title: 'Task 1', priority: 'MEDIUM' },
        { title: 'Task 2', priority: 'LOW' }
      ])

      const result = parseJSON(jsonContent)
      
      expect(result).toHaveLength(2)
      expect(result[0].title).toBe('Task 1')
      expect(result[1].title).toBe('Task 2')
    })

    it('should parse single task object', () => {
      const jsonContent = JSON.stringify({
        title: 'Single Task',
        description: 'Single task description',
        completed: true
      })

      const result = parseJSON(jsonContent)
      
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Single Task')
      expect(result[0].completed).toBe(true)
    })

    it('should handle different property name variations', () => {
      const jsonContent = JSON.stringify({
        name: 'Task Name',
        notes: 'Task notes',
        due_date: '2024-01-15',
        done: true,
        project: 'Work'
      })

      const result = parseJSON(jsonContent)
      
      expect(result[0].title).toBe('Task Name')
      expect(result[0].description).toBe('Task notes')
      expect(result[0].completed).toBe(true)
      expect(result[0].listName).toBe('Work')
    })

    it('should throw error for invalid JSON', () => {
      expect(() => parseJSON('invalid json')).toThrow('Invalid JSON format')
      expect(() => parseJSON('{broken json')).toThrow('Invalid JSON format')
    })
  })

  describe('parseTodoist', () => {
    it('should parse Todoist export format', () => {
      const todoistData = {
        items: [
          {
            content: 'Todoist Task',
            description: 'Task description',
            priority: 3,
            checked: 0,
            due: { date: '2024-01-15' },
            project_id: 1,
            labels: [{ name: 'urgent' }]
          }
        ],
        projects: [
          { id: 1, name: 'Work Project' }
        ]
      }

      const result = parseTodoist(JSON.stringify(todoistData))
      
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Todoist Task')
      expect(result[0].priority).toBe(Priority.HIGH) // Todoist priority 3 = HIGH
      expect(result[0].completed).toBe(false) // checked: 0 = false
      expect(result[0].listName).toBe('Work Project')
      expect(result[0].tags).toEqual(['urgent'])
    })

    it('should handle completed Todoist tasks', () => {
      const todoistData = {
        items: [{ content: 'Completed Task', checked: 1, priority: 4 }],
        projects: []
      }

      const result = parseTodoist(JSON.stringify(todoistData))
      
      expect(result[0].completed).toBe(true)
      expect(result[0].priority).toBe(Priority.URGENT) // Priority 4 = URGENT
    })

    it('should throw error for invalid Todoist format', () => {
      expect(() => parseTodoist('invalid')).toThrow('Invalid Todoist format')
    })
  })

  describe('parseAnyDo', () => {
    it('should parse Any.do export format', () => {
      const anydoData = {
        tasks: [
          {
            title: 'Any.do Task',
            note: 'Task note',
            status: 'DONE',
            dueDate: '2024-01-15T10:00:00Z',
            categoryId: 'cat1'
          }
        ],
        categories: [
          { id: 'cat1', name: 'Personal' }
        ]
      }

      const result = parseAnyDo(JSON.stringify(anydoData))
      
      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Any.do Task')
      expect(result[0].description).toBe('Task note')
      expect(result[0].completed).toBe(true) // status: 'DONE' = true
      expect(result[0].listName).toBe('Personal')
    })

    it('should handle pending Any.do tasks', () => {
      const anydoData = {
        tasks: [{ title: 'Pending Task', status: 'TODO' }],
        categories: []
      }

      const result = parseAnyDo(JSON.stringify(anydoData))
      
      expect(result[0].completed).toBe(false)
    })

    it('should throw error for invalid Any.do format', () => {
      expect(() => parseAnyDo('invalid')).toThrow('Invalid Any.do format')
    })
  })

  describe('detectFormat', () => {
    it('should detect format by file extension', () => {
      expect(detectFormat('any content', 'tasks.csv')).toBe('csv')
      expect(detectFormat('any content', 'tasks.json')).toBe('json')
      expect(detectFormat('any content', 'TASKS.CSV')).toBe('csv')
    })

    it('should detect Todoist format by content', () => {
      const todoistContent = JSON.stringify({
        items: [{ content: 'task' }],
        projects: [{ id: 1, name: 'project' }]
      })
      
      expect(detectFormat(todoistContent)).toBe('todoist')
    })

    it('should detect Any.do format by content', () => {
      const anydoContent = JSON.stringify({
        tasks: [{ title: 'task' }],
        categories: [{ id: '1', name: 'category' }]
      })
      
      expect(detectFormat(anydoContent)).toBe('anydo')
    })

    it('should detect our JSON format', () => {
      const ourContent = JSON.stringify({
        tasks: [],
        lists: [],
        version: '1.0'
      })
      
      expect(detectFormat(ourContent)).toBe('json')
    })

    it('should detect CSV by content structure', () => {
      const csvContent = `title,description
Task 1,Description 1
Task 2,Description 2`
      
      expect(detectFormat(csvContent)).toBe('csv')
    })

    it('should return unknown for unrecognized formats', () => {
      expect(detectFormat('random text content')).toBe('unknown')
      expect(detectFormat('')).toBe('unknown')
    })
  })

  describe('validateImportTasks', () => {
    it('should validate correct tasks', () => {
      const tasks = [
        { title: 'Valid Task', priority: Priority.HIGH, completed: false },
        { title: 'Another Valid Task', description: 'With description', priority: Priority.MEDIUM, completed: true }
      ]

      const result = validateImportTasks(tasks)
      
      expect(result.valid).toHaveLength(2)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject tasks without titles', () => {
      const tasks = [
        { title: '', priority: Priority.HIGH, completed: false },
        { title: '   ', priority: Priority.MEDIUM, completed: false },
        { title: 'Valid Task', priority: Priority.LOW, completed: false }
      ]

      const result = validateImportTasks(tasks)
      
      expect(result.valid).toHaveLength(1)
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0]).toContain('Row 1: Task title is required')
      expect(result.errors[1]).toContain('Row 2: Task title is required')
    })

    it('should reject tasks with too long titles', () => {
      const longTitle = 'x'.repeat(501)
      const tasks = [
        { title: longTitle, priority: Priority.HIGH, completed: false }
      ]

      const result = validateImportTasks(tasks)
      
      expect(result.valid).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Task title is too long')
    })

    it('should reject tasks with too long descriptions', () => {
      const longDescription = 'x'.repeat(2001)
      const tasks = [
        { title: 'Valid Title', description: longDescription, priority: Priority.HIGH, completed: false }
      ]

      const result = validateImportTasks(tasks)
      
      expect(result.valid).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Task description is too long')
    })
  })

  describe('DEFAULT_IMPORT_OPTIONS', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_IMPORT_OPTIONS.createMissingLists).toBe(true)
      expect(DEFAULT_IMPORT_OPTIONS.skipDuplicates).toBe(true)
      expect(DEFAULT_IMPORT_OPTIONS.defaultPriority).toBe(Priority.MEDIUM)
    })
  })
})