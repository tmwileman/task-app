import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
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

    const listId = params.id
    const body = await request.json()

    // Verify list belongs to user
    const existingList = await db.taskList.findFirst({
      where: {
        id: listId,
        userId: session.user.id,
      },
    })

    if (!existingList) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    const updateData: any = {}

    if (body.name !== undefined) {
      if (!body.name || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'List name is required' },
          { status: 400 }
        )
      }
      updateData.name = body.name.trim()
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null
    }

    if (body.color !== undefined) {
      updateData.color = body.color || '#3b82f6'
    }

    if (body.order !== undefined) {
      updateData.order = body.order
    }

    const list = await db.taskList.update({
      where: { id: listId },
      data: updateData,
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
    })

    return NextResponse.json({ list })
  } catch (error) {
    console.error('Error updating task list:', error)
    return NextResponse.json(
      { error: 'Failed to update task list' },
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

    const listId = params.id

    // Verify list belongs to user
    const existingList = await db.taskList.findFirst({
      where: {
        id: listId,
        userId: session.user.id,
      },
    })

    if (!existingList) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Prevent deletion of default lists
    if (existingList.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default lists' },
        { status: 400 }
      )
    }

    // Move tasks to default list before deleting
    const defaultList = await db.taskList.findFirst({
      where: {
        userId: session.user.id,
        isDefault: true,
      },
    })

    if (defaultList) {
      await db.task.updateMany({
        where: { listId },
        data: { listId: defaultList.id },
      })
    }

    await db.taskList.delete({
      where: { id: listId },
    })

    return NextResponse.json({ message: 'List deleted successfully' })
  } catch (error) {
    console.error('Error deleting task list:', error)
    return NextResponse.json(
      { error: 'Failed to delete task list' },
      { status: 500 }
    )
  }
}