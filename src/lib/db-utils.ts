import { db } from './db'
import { Priority, Prisma } from '@prisma/client'

// Task utility functions
export async function createTask(data: {
  title: string
  description?: string
  priority?: Priority
  dueDate?: Date
  listId?: string
  parentId?: string
  userId: string
}) {
  return await db.task.create({
    data: {
      ...data,
      order: await getNextTaskOrder(data.listId, data.parentId),
    },
    include: {
      list: true,
      parent: true,
      subtasks: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
  })
}

export async function updateTask(
  id: string,
  data: Partial<{
    title: string
    description: string
    completed: boolean
    priority: Priority
    dueDate: Date
    reminder: Date
    listId: string
    order: number
  }>
) {
  const updateData: any = { ...data }
  
  if (data.completed !== undefined) {
    updateData.completedAt = data.completed ? new Date() : null
  }

  return await db.task.update({
    where: { id },
    data: updateData,
    include: {
      list: true,
      parent: true,
      subtasks: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
  })
}

export async function deleteTask(id: string) {
  return await db.task.delete({
    where: { id },
  })
}

export async function getTasksByUser(userId: string, filters?: {
  listId?: string
  completed?: boolean
  priority?: Priority
  search?: string
  filter?: string
  cursor?: string
  limit?: number
}) {
  const where: Prisma.TaskWhereInput = {
    userId,
    parentId: null, // Only get top-level tasks
  }

  if (filters?.listId) {
    where.listId = filters.listId
  }

  if (filters?.completed !== undefined) {
    where.completed = filters.completed
  }

  if (filters?.priority) {
    where.priority = filters.priority
  }

  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  // Time-based filtering
  if (filters?.filter) {
    const now = new Date()
    
    switch (filters.filter) {
      case 'today':
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const endOfToday = new Date(startOfToday)
        endOfToday.setDate(endOfToday.getDate() + 1)
        where.dueDate = {
          gte: startOfToday,
          lt: endOfToday,
        }
        break
        
      case 'tomorrow':
        const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        const endOfTomorrow = new Date(startOfTomorrow)
        endOfTomorrow.setDate(endOfTomorrow.getDate() + 1)
        where.dueDate = {
          gte: startOfTomorrow,
          lt: endOfTomorrow,
        }
        break
        
      case 'week':
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(endOfWeek.getDate() + 7)
        where.dueDate = {
          gte: startOfWeek,
          lt: endOfWeek,
        }
        break
        
      case 'overdue':
        where.dueDate = {
          lt: now,
        }
        where.completed = false
        break
    }
  }

  // Handle pagination for infinite scrolling
  if (filters?.cursor || filters?.limit) {
    const limit = filters.limit || 20
    const cursor = filters.cursor ? { id: filters.cursor } : undefined

    // Get total count for pagination info
    const totalCount = await db.task.count({ where })

    // Get tasks with cursor-based pagination
    const tasks = await db.task.findMany({
      where,
      include: {
        list: true,
        subtasks: {
          orderBy: { order: 'asc' },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: [
        { completed: 'asc' },
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
      take: limit + 1, // Take one extra to determine if there's a next page
      cursor,
      skip: cursor ? 1 : 0, // Skip the cursor item itself
    })

    const hasNextPage = tasks.length > limit
    const tasksToReturn = hasNextPage ? tasks.slice(0, -1) : tasks
    const nextCursor = hasNextPage ? tasks[tasks.length - 2]?.id : undefined

    return {
      tasks: tasksToReturn,
      nextCursor,
      hasNextPage,
      totalCount,
    }
  }

  // Return all tasks for non-paginated requests (backward compatibility)
  const tasks = await db.task.findMany({
    where,
    include: {
      list: true,
      subtasks: {
        orderBy: { order: 'asc' },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
    orderBy: [
      { completed: 'asc' },
      { order: 'asc' },
      { createdAt: 'desc' },
    ],
  })

  return tasks
}

// TaskList utility functions
export async function createTaskList(data: {
  name: string
  description?: string
  color?: string
  userId: string
}) {
  return await db.taskList.create({
    data: {
      ...data,
      order: await getNextListOrder(data.userId),
    },
    include: {
      tasks: {
        where: { parentId: null },
        orderBy: { order: 'asc' },
      },
    },
  })
}

export async function getTaskListsByUser(userId: string) {
  return await db.taskList.findMany({
    where: { userId },
    include: {
      tasks: {
        where: { parentId: null },
        orderBy: [
          { completed: 'asc' },
          { order: 'asc' },
        ],
      },
      _count: {
        select: {
          tasks: {
            where: { completed: false },
          },
        },
      },
    },
    orderBy: { order: 'asc' },
  })
}

// Tag utility functions
export async function createTag(data: { name: string; color?: string }) {
  return await db.tag.upsert({
    where: { name: data.name },
    update: {},
    create: data,
  })
}

export async function getTags() {
  return await db.tag.findMany({
    orderBy: { name: 'asc' },
  })
}

export async function addTagToTask(taskId: string, tagId: string) {
  return await db.taskTag.create({
    data: { taskId, tagId },
  })
}

export async function removeTagFromTask(taskId: string, tagId: string) {
  return await db.taskTag.delete({
    where: {
      taskId_tagId: { taskId, tagId },
    },
  })
}

// Helper functions
async function getNextTaskOrder(listId?: string, parentId?: string): Promise<number> {
  const where: Prisma.TaskWhereInput = {}
  
  if (parentId) {
    where.parentId = parentId
  } else if (listId) {
    where.listId = listId
    where.parentId = null
  }

  const lastTask = await db.task.findFirst({
    where,
    orderBy: { order: 'desc' },
    select: { order: true },
  })

  return (lastTask?.order ?? -1) + 1
}

async function getNextListOrder(userId: string): Promise<number> {
  const lastList = await db.taskList.findFirst({
    where: { userId },
    orderBy: { order: 'desc' },
    select: { order: true },
  })

  return (lastList?.order ?? -1) + 1
}

// Dashboard data functions
export async function getDashboardData(userId: string) {
  const [tasks, lists, overdueTasks, todayTasks, upcomingTasks] = await Promise.all([
    // All incomplete tasks
    db.task.count({
      where: {
        userId,
        completed: false,
      },
    }),
    // All lists with task counts
    getTaskListsByUser(userId),
    // Overdue tasks
    db.task.findMany({
      where: {
        userId,
        completed: false,
        dueDate: {
          lt: new Date(),
        },
      },
      include: {
        list: true,
      },
      orderBy: { dueDate: 'asc' },
    }),
    // Today's tasks
    db.task.findMany({
      where: {
        userId,
        completed: false,
        dueDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
      include: {
        list: true,
        subtasks: true,
      },
      orderBy: [
        { priority: 'desc' },
        { order: 'asc' },
      ],
    }),
    // Upcoming tasks (next 7 days)
    db.task.findMany({
      where: {
        userId,
        completed: false,
        dueDate: {
          gt: new Date(new Date().setHours(23, 59, 59, 999)),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        list: true,
      },
      orderBy: { dueDate: 'asc' },
    }),
  ])

  return {
    totalTasks: tasks,
    lists,
    overdueTasks,
    todayTasks,
    upcomingTasks,
  }
}

// Task scheduling algorithms
export function suggestOptimalDueDate(priority: Priority, estimatedHours?: number): Date {
  const now = new Date()
  let daysToAdd = 7 // Default: one week
  
  switch (priority) {
    case Priority.URGENT:
      daysToAdd = 1 // Tomorrow
      break
    case Priority.HIGH:
      daysToAdd = 3 // 3 days
      break
    case Priority.MEDIUM:
      daysToAdd = 7 // 1 week
      break
    case Priority.LOW:
      daysToAdd = 14 // 2 weeks
      break
  }
  
  // Adjust based on estimated hours
  if (estimatedHours) {
    if (estimatedHours > 8) daysToAdd += 3 // Large tasks need more time
    if (estimatedHours > 16) daysToAdd += 7 // Very large tasks
  }
  
  const suggestedDate = new Date(now)
  suggestedDate.setDate(now.getDate() + daysToAdd)
  
  // Don't schedule on weekends for work tasks
  const dayOfWeek = suggestedDate.getDay()
  if (dayOfWeek === 0) { // Sunday
    suggestedDate.setDate(suggestedDate.getDate() + 1)
  } else if (dayOfWeek === 6) { // Saturday
    suggestedDate.setDate(suggestedDate.getDate() + 2)
  }
  
  // Set to 9 AM on the suggested day
  suggestedDate.setHours(9, 0, 0, 0)
  
  return suggestedDate
}

export function calculateNextRecurrence(
  lastDate: Date, 
  recurringType: string, 
  interval: number = 1
): Date {
  const nextDate = new Date(lastDate)
  
  switch (recurringType) {
    case 'DAILY':
      nextDate.setDate(nextDate.getDate() + interval)
      break
    case 'WEEKLY':
      nextDate.setDate(nextDate.getDate() + (7 * interval))
      break
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + interval)
      break
    case 'YEARLY':
      nextDate.setFullYear(nextDate.getFullYear() + interval)
      break
  }
  
  return nextDate
}

export async function createRecurringTaskInstance(originalTaskId: string) {
  const originalTask = await db.task.findUnique({
    where: { id: originalTaskId },
    include: { tags: true }
  })
  
  if (!originalTask || !originalTask.isRecurring || !originalTask.recurringType) {
    return null
  }
  
  const nextDueDate = calculateNextRecurrence(
    originalTask.dueDate || new Date(),
    originalTask.recurringType,
    originalTask.recurringInterval || 1
  )
  
  // Check if we should stop recurring
  if (originalTask.recurringUntil && nextDueDate > originalTask.recurringUntil) {
    return null
  }
  
  // Create new task instance
  const newTask = await db.task.create({
    data: {
      title: originalTask.title,
      description: originalTask.description,
      priority: originalTask.priority,
      dueDate: nextDueDate,
      reminder: originalTask.reminder ? 
        new Date(nextDueDate.getTime() - (originalTask.dueDate!.getTime() - originalTask.reminder.getTime())) : 
        null,
      userId: originalTask.userId,
      listId: originalTask.listId,
      isRecurring: true,
      recurringType: originalTask.recurringType,
      recurringInterval: originalTask.recurringInterval,
      recurringDays: originalTask.recurringDays,
      recurringUntil: originalTask.recurringUntil,
      order: await getNextTaskOrder(originalTask.listId),
    }
  })
  
  // Update the original task's lastRecurrence
  await db.task.update({
    where: { id: originalTaskId },
    data: { lastRecurrence: new Date() }
  })
  
  return newTask
}