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

  return await db.task.findMany({
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