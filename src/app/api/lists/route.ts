import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createTaskList, getTaskListsByUser } from '@/lib/db-utils'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lists = await getTaskListsByUser(session.user.id)

    return NextResponse.json({ lists })
  } catch (error) {
    console.error('Error fetching task lists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task lists' },
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
    const { name, description, color } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'List name is required' },
        { status: 400 }
      )
    }

    const listData = {
      name: name.trim(),
      description: description?.trim() || undefined,
      color: color || '#3b82f6',
      userId: session.user.id,
    }

    const list = await createTaskList(listData)

    return NextResponse.json({ list }, { status: 201 })
  } catch (error) {
    console.error('Error creating task list:', error)
    return NextResponse.json(
      { error: 'Failed to create task list' },
      { status: 500 }
    )
  }
}