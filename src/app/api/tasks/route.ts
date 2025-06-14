import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createTask, getTasksByUser } from '@/lib/db-utils'
import { Priority } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const listId = searchParams.get('listId') || undefined
    const completed = searchParams.get('completed') === 'true' ? true : 
                     searchParams.get('completed') === 'false' ? false : undefined
    const priority = searchParams.get('priority') as Priority || undefined
    const search = searchParams.get('search') || undefined
    const filter = searchParams.get('filter') || undefined

    const tasks = await getTasksByUser(session.user.id, {
      listId,
      completed,
      priority,
      search,
      filter,
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, priority, dueDate, listId, parentId } = body

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      )
    }

    const taskData = {
      title: title.trim(),
      description: description?.trim() || undefined,
      priority: priority || Priority.MEDIUM,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      listId: listId || undefined,
      parentId: parentId || undefined,
      userId: session.user.id,
    }

    const task = await createTask(taskData)

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}