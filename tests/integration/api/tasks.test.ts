import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/tasks/route'
import { GET as getTask, PUT as updateTask, DELETE as deleteTask } from '@/app/api/tasks/[id]/route'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth/next'

// Mock dependencies
jest.mock('@/lib/db', () => ({
  db: {
    task: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    }
  }
}))

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}))

const mockSession = {
  user: { id: 'user1', email: 'test@example.com' }
}

const mockTask = {
  id: 'task1',
  title: 'Test Task',
  description: 'Test description',
  completed: false,
  priority: 'HIGH',
  userId: 'user1',
  listId: 'list1',
  createdAt: new Date(),
  updatedAt: new Date(),
  dueDate: null,
  completedAt: null,
  parentId: null,
  isRecurring: false,
  archived: false,
  archivedAt: null
}

describe('/api/tasks Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
  })

  describe('GET /api/tasks', () => {
    it('should fetch tasks for authenticated user', async () => {
      ;(db.task.findMany as jest.Mock).mockResolvedValue([mockTask])
      ;(db.task.count as jest.Mock).mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/tasks')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tasks).toHaveLength(1)
      expect(data.tasks[0].id).toBe('task1')
      expect(data.totalCount).toBe(1)
    })

    it('should handle query parameters for filtering', async () => {
      ;(db.task.findMany as jest.Mock).mockResolvedValue([])
      ;(db.task.count as jest.Mock).mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/tasks?completed=true&priority=HIGH')
      await GET(request)

      expect(db.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user1',
            completed: true,
            priority: 'HIGH'
          })
        })
      )
    })

    it('should return 401 for unauthenticated users', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/tasks')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should handle search parameter', async () => {
      ;(db.task.findMany as jest.Mock).mockResolvedValue([])
      ;(db.task.count as jest.Mock).mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/tasks?search=test')
      await GET(request)

      expect(db.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user1',
            OR: [
              { title: { contains: 'test', mode: 'insensitive' } },
              { description: { contains: 'test', mode: 'insensitive' } }
            ]
          })
        })
      )
    })
  })

  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const newTask = { ...mockTask, id: 'new-task' }
      ;(db.task.create as jest.Mock).mockResolvedValue(newTask)

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Task',
          description: 'New description',
          priority: 'MEDIUM'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('new-task')
      expect(db.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'New Task',
          description: 'New description',
          priority: 'MEDIUM',
          userId: 'user1'
        })
      })
    })

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          description: 'No title provided'
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Title is required')
    })

    it('should handle database errors', async () => {
      ;(db.task.create as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Task'
        })
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })
  })

  describe('GET /api/tasks/[id]', () => {
    it('should fetch a specific task', async () => {
      ;(db.task.findUnique as jest.Mock).mockResolvedValue(mockTask)

      const response = await getTask(
        new NextRequest('http://localhost:3000/api/tasks/task1'),
        { params: { id: 'task1' } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('task1')
      expect(db.task.findUnique).toHaveBeenCalledWith({
        where: { id: 'task1', userId: 'user1' },
        include: expect.any(Object)
      })
    })

    it('should return 404 for non-existent task', async () => {
      ;(db.task.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await getTask(
        new NextRequest('http://localhost:3000/api/tasks/nonexistent'),
        { params: { id: 'nonexistent' } }
      )

      expect(response.status).toBe(404)
    })

    it('should not return tasks from other users', async () => {
      ;(db.task.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await getTask(
        new NextRequest('http://localhost:3000/api/tasks/other-user-task'),
        { params: { id: 'other-user-task' } }
      )

      expect(response.status).toBe(404)
      expect(db.task.findUnique).toHaveBeenCalledWith({
        where: { id: 'other-user-task', userId: 'user1' },
        include: expect.any(Object)
      })
    })
  })

  describe('PUT /api/tasks/[id]', () => {
    it('should update an existing task', async () => {
      const updatedTask = { ...mockTask, title: 'Updated Task' }
      ;(db.task.findUnique as jest.Mock).mockResolvedValue(mockTask)
      ;(db.task.update as jest.Mock).mockResolvedValue(updatedTask)

      const response = await updateTask(
        new NextRequest('http://localhost:3000/api/tasks/task1', {
          method: 'PUT',
          body: JSON.stringify({
            title: 'Updated Task',
            completed: true
          })
        }),
        { params: { id: 'task1' } }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.title).toBe('Updated Task')
      expect(db.task.update).toHaveBeenCalledWith({
        where: { id: 'task1' },
        data: expect.objectContaining({
          title: 'Updated Task',
          completed: true
        }),
        include: expect.any(Object)
      })
    })

    it('should handle completion state changes', async () => {
      ;(db.task.findUnique as jest.Mock).mockResolvedValue(mockTask)
      ;(db.task.update as jest.Mock).mockResolvedValue({ ...mockTask, completed: true })

      const response = await updateTask(
        new NextRequest('http://localhost:3000/api/tasks/task1', {
          method: 'PUT',
          body: JSON.stringify({ completed: true })
        }),
        { params: { id: 'task1' } }
      )

      expect(response.status).toBe(200)
      expect(db.task.update).toHaveBeenCalledWith({
        where: { id: 'task1' },
        data: expect.objectContaining({
          completed: true,
          completedAt: expect.any(Date)
        }),
        include: expect.any(Object)
      })
    })

    it('should return 404 for non-existent task', async () => {
      ;(db.task.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await updateTask(
        new NextRequest('http://localhost:3000/api/tasks/nonexistent', {
          method: 'PUT',
          body: JSON.stringify({ title: 'Updated' })
        }),
        { params: { id: 'nonexistent' } }
      )

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/tasks/[id]', () => {
    it('should delete an existing task', async () => {
      ;(db.task.findUnique as jest.Mock).mockResolvedValue(mockTask)
      ;(db.task.delete as jest.Mock).mockResolvedValue(mockTask)

      const response = await deleteTask(
        new NextRequest('http://localhost:3000/api/tasks/task1', {
          method: 'DELETE'
        }),
        { params: { id: 'task1' } }
      )

      expect(response.status).toBe(200)
      expect(db.task.delete).toHaveBeenCalledWith({
        where: { id: 'task1' }
      })
    })

    it('should return 404 for non-existent task', async () => {
      ;(db.task.findUnique as jest.Mock).mockResolvedValue(null)

      const response = await deleteTask(
        new NextRequest('http://localhost:3000/api/tasks/nonexistent', {
          method: 'DELETE'
        }),
        { params: { id: 'nonexistent' } }
      )

      expect(response.status).toBe(404)
    })

    it('should handle database errors during deletion', async () => {
      ;(db.task.findUnique as jest.Mock).mockResolvedValue(mockTask)
      ;(db.task.delete as jest.Mock).mockRejectedValue(new Error('Database error'))

      const response = await deleteTask(
        new NextRequest('http://localhost:3000/api/tasks/task1', {
          method: 'DELETE'
        }),
        { params: { id: 'task1' } }
      )

      expect(response.status).toBe(500)
    })
  })
})