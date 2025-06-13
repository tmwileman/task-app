import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { updateTask, deleteTask } from '@/lib/db-utils'
import { Priority } from '@prisma/client'
import { db } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = params.id
    const body = await request.json()

    // Verify task belongs to user
    const existingTask = await db.task.findFirst({
      where: {
        id: taskId,
        userId: session.user.id,
      },
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const updateData: any = {}

    if (body.title !== undefined) {
      if (!body.title || body.title.trim().length === 0) {
        return NextResponse.json(
          { error: 'Task title is required' },
          { status: 400 }
        )
      }
      updateData.title = body.title.trim()
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null
    }

    if (body.completed !== undefined) {
      updateData.completed = body.completed
    }

    if (body.priority !== undefined) {
      updateData.priority = body.priority as Priority
    }

    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null
    }

    if (body.reminder !== undefined) {
      updateData.reminder = body.reminder ? new Date(body.reminder) : null
    }

    if (body.listId !== undefined) {
      updateData.listId = body.listId || null
    }

    if (body.order !== undefined) {
      updateData.order = body.order
    }

    const task = await updateTask(taskId, updateData)

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const taskId = params.id

    // Verify task belongs to user
    const existingTask = await db.task.findFirst({
      where: {
        id: taskId,
        userId: session.user.id,
      },
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    await deleteTask(taskId)

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}