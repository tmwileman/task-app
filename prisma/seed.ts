import { PrismaClient, Priority } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create sample user
  const user = await prisma.user.upsert({
    where: { email: 'demo@taskapp.com' },
    update: {},
    create: {
      email: 'demo@taskapp.com',
      name: 'Demo User',
      image: 'https://via.placeholder.com/150',
    },
  })

  console.log('Created user:', user.email)

  // Create default task lists
  const todayList = await prisma.taskList.upsert({
    where: { id: 'today-list' },
    update: {},
    create: {
      id: 'today-list',
      name: 'Today',
      description: 'Tasks for today',
      color: '#3b82f6',
      isDefault: true,
      order: 0,
      userId: user.id,
    },
  })

  const upcomingList = await prisma.taskList.upsert({
    where: { id: 'upcoming-list' },
    update: {},
    create: {
      id: 'upcoming-list',
      name: 'Upcoming',
      description: 'Future tasks',
      color: '#10b981',
      isDefault: true,
      order: 1,
      userId: user.id,
    },
  })

  const personalList = await prisma.taskList.upsert({
    where: { id: 'personal-list' },
    update: {},
    create: {
      id: 'personal-list',
      name: 'Personal',
      description: 'Personal tasks and goals',
      color: '#8b5cf6',
      isDefault: false,
      order: 2,
      userId: user.id,
    },
  })

  const workList = await prisma.taskList.upsert({
    where: { id: 'work-list' },
    update: {},
    create: {
      id: 'work-list',
      name: 'Work',
      description: 'Work-related tasks',
      color: '#f59e0b',
      isDefault: false,
      order: 3,
      userId: user.id,
    },
  })

  console.log('Created task lists')

  // Create sample tags
  const urgentTag = await prisma.tag.upsert({
    where: { name: 'urgent' },
    update: {},
    create: {
      name: 'urgent',
      color: '#ef4444',
    },
  })

  const meetingTag = await prisma.tag.upsert({
    where: { name: 'meeting' },
    update: {},
    create: {
      name: 'meeting',
      color: '#06b6d4',
    },
  })

  const personalTag = await prisma.tag.upsert({
    where: { name: 'personal' },
    update: {},
    create: {
      name: 'personal',
      color: '#8b5cf6',
    },
  })

  console.log('Created tags')

  // Create sample tasks
  const tasks = await Promise.all([
    prisma.task.upsert({
      where: { id: 'task-1' },
      update: {},
      create: {
        id: 'task-1',
        title: 'Review project proposal',
        description: 'Go through the Q3 project proposal and provide feedback',
        priority: Priority.HIGH,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        completed: false,
        order: 0,
        userId: user.id,
        listId: workList.id,
      },
    }),
    prisma.task.upsert({
      where: { id: 'task-2' },
      update: {},
      create: {
        id: 'task-2',
        title: 'Team standup meeting',
        description: 'Daily standup with the development team',
        priority: Priority.MEDIUM,
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // In 2 hours
        completed: false,
        order: 1,
        userId: user.id,
        listId: todayList.id,
      },
    }),
    prisma.task.upsert({
      where: { id: 'task-3' },
      update: {},
      create: {
        id: 'task-3',
        title: 'Grocery shopping',
        description: 'Buy ingredients for weekend dinner party',
        priority: Priority.LOW,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
        completed: false,
        order: 0,
        userId: user.id,
        listId: personalList.id,
      },
    }),
    prisma.task.upsert({
      where: { id: 'task-4' },
      update: {},
      create: {
        id: 'task-4',
        title: 'Complete task management app',
        description: 'Finish building the task management application',
        priority: Priority.HIGH,
        completed: false,
        order: 2,
        userId: user.id,
        listId: workList.id,
      },
    }),
    prisma.task.upsert({
      where: { id: 'task-5' },
      update: {},
      create: {
        id: 'task-5',
        title: 'Call dentist',
        description: 'Schedule routine cleaning appointment',
        priority: Priority.MEDIUM,
        completed: true,
        completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        order: 1,
        userId: user.id,
        listId: personalList.id,
      },
    }),
  ])

  // Create subtasks
  const subtask1 = await prisma.task.upsert({
    where: { id: 'subtask-1' },
    update: {},
    create: {
      id: 'subtask-1',
      title: 'Read executive summary',
      description: 'Review the executive summary section',
      priority: Priority.MEDIUM,
      completed: false,
      order: 0,
      userId: user.id,
      parentId: tasks[0].id,
    },
  })

  const subtask2 = await prisma.task.upsert({
    where: { id: 'subtask-2' },
    update: {},
    create: {
      id: 'subtask-2',
      title: 'Check budget allocation',
      description: 'Verify the proposed budget makes sense',
      priority: Priority.MEDIUM,
      completed: true,
      completedAt: new Date(),
      order: 1,
      userId: user.id,
      parentId: tasks[0].id,
    },
  })

  // Create task-tag relationships
  await prisma.taskTag.createMany({
    data: [
      { taskId: tasks[0].id, tagId: urgentTag.id },
      { taskId: tasks[1].id, tagId: meetingTag.id },
      { taskId: tasks[2].id, tagId: personalTag.id },
      { taskId: tasks[4].id, tagId: personalTag.id },
    ],
    skipDuplicates: true,
  })

  console.log('Created tasks and subtasks')
  console.log('Seed completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })