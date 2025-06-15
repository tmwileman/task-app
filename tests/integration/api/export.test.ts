import { NextRequest } from 'next/server'
import { POST } from '@/app/api/export/route'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    task: {
      findMany: jest.fn()
    },
    taskList: {
      findMany: jest.fn()
    }
  }
}))

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}))

const mockSession = {
  user: { id: 'user1', email: 'test@example.com' }
}

const mockTasks = [
  {
    id: 'task1',
    title: 'Test Task 1',
    description: 'Description 1',
    completed: false,
    priority: 'HIGH',
    dueDate: new Date('2024-01-15'),
    createdAt: new Date('2024-01-01'),
    completedAt: null,
    userId: 'user1',
    listId: 'list1',
    parentId: null,
    isRecurring: false,
    archived: false,
    archivedAt: null,
    list: {
      id: 'list1',
      name: 'Work',
      userId: 'user1',
      createdAt: new Date('2024-01-01')
    },
    subtasks: [],
    tags: [
      {
        id: '1',
        taskId: 'task1',
        tagId: 'tag1',
        tag: {
          id: 'tag1',
          name: 'urgent',
          userId: 'user1',
          createdAt: new Date('2024-01-01')
        }
      }
    ]
  },
  {
    id: 'task2',
    title: 'Test Task 2',
    description: 'Description 2',
    completed: true,
    priority: 'MEDIUM',
    dueDate: null,
    createdAt: new Date('2024-01-02'),
    completedAt: new Date('2024-01-03'),
    userId: 'user1',
    listId: null,
    parentId: null,
    isRecurring: false,
    archived: false,
    archivedAt: null,
    list: null,
    subtasks: [],
    tags: []
  }
]

const mockLists = [
  {
    id: 'list1',
    name: 'Work',
    userId: 'user1',
    createdAt: new Date('2024-01-01')
  }
]

describe('/api/export Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(db.task.findMany as jest.Mock).mockResolvedValue(mockTasks)
    ;(db.taskList.findMany as jest.Mock).mockResolvedValue(mockLists)
  })

  describe('POST /api/export', () => {
    it('should export tasks in JSON format', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({
          options: {
            format: 'json',
            includeCompleted: true,
            includeArchived: false
          }
        })
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('application/json')
      expect(response.headers.get('Content-Disposition')).toContain('attachment')
      expect(response.headers.get('Content-Disposition')).toContain('.json')

      const responseData = await response.json()
      expect(responseData.tasks).toHaveLength(2)
      expect(responseData.lists).toHaveLength(1)
      expect(responseData.version).toBe('1.0')
    })

    it('should export tasks in CSV format', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({
          options: {
            format: 'csv',
            includeCompleted: true,
            includeArchived: false
          }
        })
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/csv')
      expect(response.headers.get('Content-Disposition')).toContain('.csv')

      const csvContent = await response.text()
      expect(csvContent).toContain('Title,Description,Status,Priority')
      expect(csvContent).toContain('Test Task 1,Description 1,Pending,HIGH')
      expect(csvContent).toContain('Test Task 2,Description 2,Completed,MEDIUM')
    })

    it('should export tasks in iCal format', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({
          options: {
            format: 'ical',
            includeCompleted: true,
            includeArchived: false
          }
        })
      })

      const response = await POST(request)
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/calendar')
      expect(response.headers.get('Content-Disposition')).toContain('.ics')

      const icalContent = await response.text()
      expect(icalContent).toContain('BEGIN:VCALENDAR')
      expect(icalContent).toContain('END:VCALENDAR')
      expect(icalContent).toContain('SUMMARY:Test Task 1')
      // Task 2 should not be included as it has no due date
      expect(icalContent).not.toContain('SUMMARY:Test Task 2')
    })

    it('should filter completed tasks when includeCompleted is false', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({
          options: {
            format: 'json',
            includeCompleted: false,
            includeArchived: false
          }
        })
      })

      await POST(request)

      expect(db.task.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: 'user1',
          completed: false,
          archived: false
        }),
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should filter by date range when provided', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({
          options: {
            format: 'json',
            includeCompleted: true,
            includeArchived: false,
            dateRange: {
              start: startDate.toISOString(),
              end: endDate.toISOString()
            }
          }
        })
      })

      await POST(request)

      expect(db.task.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: 'user1',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }),
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should filter by specific lists when provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({
          options: {
            format: 'json',
            includeCompleted: true,
            includeArchived: false,
            listIds: ['list1']
          }
        })
      })

      await POST(request)

      expect(db.task.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: 'user1',
          listId: { in: ['list1'] }
        }),
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should return 401 for unauthenticated users', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({
          options: { format: 'json' }
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should handle invalid export format', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({
          options: {
            format: 'invalid-format',
            includeCompleted: true,
            includeArchived: false
          }
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('format')
    })

    it('should handle database errors', async () => {
      ;(db.task.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({
          options: {
            format: 'json',
            includeCompleted: true,
            includeArchived: false
          }
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('should use default options when none provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({})
      })

      await POST(request)

      expect(db.task.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: 'user1',
          completed: undefined, // Should not filter by completion status
          archived: false
        }),
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' }
      })
    })

    it('should generate proper filename with timestamp', async () => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'))

      const request = new NextRequest('http://localhost:3000/api/export', {
        method: 'POST',
        body: JSON.stringify({
          options: {
            format: 'csv',
            includeCompleted: true,
            includeArchived: false
          }
        })
      })

      const response = await POST(request)
      
      expect(response.headers.get('Content-Disposition')).toContain('2024-01-15')
      expect(response.headers.get('Content-Disposition')).toContain('task-app-export')

      jest.useRealTimers()
    })
  })
})