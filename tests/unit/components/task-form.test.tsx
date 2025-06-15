import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TaskForm } from '@/components/task-form'
import { Priority } from '@prisma/client'

// Mock the useSession hook
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 'user1', email: 'test@example.com' } },
    status: 'authenticated'
  })
}))

// Mock the fetch function
global.fetch = jest.fn()

const mockLists = [
  { id: 'list1', name: 'Work', userId: 'user1', createdAt: new Date(), tasks: [] },
  { id: 'list2', name: 'Personal', userId: 'user1', createdAt: new Date(), tasks: [] }
]

const defaultProps = {
  onSubmit: jest.fn(),
  onCancel: jest.fn(),
  lists: mockLists
}

describe('TaskForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'new-task-id' })
    })
  })

  it('should render form fields correctly', () => {
    render(<TaskForm {...defaultProps} />)
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/list/i)).toBeInTheDocument()
  })

  it('should validate required title field', async () => {
    render(<TaskForm {...defaultProps} />)
    
    const submitButton = screen.getByRole('button', { name: /create task/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument()
    })
    
    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })

  it('should submit form with valid data', async () => {
    render(<TaskForm {...defaultProps} />)
    
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'New Task' }
    })
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Task description' }
    })
    fireEvent.change(screen.getByLabelText(/priority/i), {
      target: { value: Priority.HIGH }
    })
    
    const submitButton = screen.getByRole('button', { name: /create task/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Task',
          description: 'Task description',
          priority: Priority.HIGH
        })
      )
    })
  })

  it('should populate form when editing existing task', () => {
    const existingTask = {
      id: 'task1',
      title: 'Existing Task',
      description: 'Existing description',
      priority: Priority.MEDIUM,
      dueDate: new Date('2024-01-15'),
      listId: 'list1',
      completed: false,
      userId: 'user1',
      createdAt: new Date(),
      completedAt: null,
      parentId: null,
      isRecurring: false,
      archived: false,
      archivedAt: null
    }
    
    render(<TaskForm {...defaultProps} task={existingTask} />)
    
    expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Existing description')).toBeInTheDocument()
    expect(screen.getByDisplayValue(Priority.MEDIUM)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /update task/i })).toBeInTheDocument()
  })

  it('should handle list selection', () => {
    render(<TaskForm {...defaultProps} />)
    
    const listSelect = screen.getByLabelText(/list/i)
    fireEvent.change(listSelect, { target: { value: 'list2' } })
    
    expect(listSelect).toHaveValue('list2')
  })

  it('should handle due date selection', () => {
    render(<TaskForm {...defaultProps} />)
    
    const dueDateInput = screen.getByLabelText(/due date/i)
    fireEvent.change(dueDateInput, { target: { value: '2024-01-15' } })
    
    expect(dueDateInput).toHaveValue('2024-01-15')
  })

  it('should display loading state during submission', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ ok: true, json: () => ({ id: 'new-id' }) }), 100))
    )
    
    render(<TaskForm {...defaultProps} />)
    
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'New Task' }
    })
    
    const submitButton = screen.getByRole('button', { name: /create task/i })
    fireEvent.click(submitButton)
    
    expect(screen.getByRole('button', { name: /creating/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
  })

  it('should handle form cancellation', () => {
    render(<TaskForm {...defaultProps} />)
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    
    expect(defaultProps.onCancel).toHaveBeenCalled()
  })

  it('should validate title length', async () => {
    render(<TaskForm {...defaultProps} />)
    
    const longTitle = 'x'.repeat(501)
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: longTitle }
    })
    
    const submitButton = screen.getByRole('button', { name: /create task/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/title must be 500 characters or less/i)).toBeInTheDocument()
    })
  })

  it('should validate description length', async () => {
    render(<TaskForm {...defaultProps} />)
    
    const longDescription = 'x'.repeat(2001)
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Valid Title' }
    })
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: longDescription }
    })
    
    const submitButton = screen.getByRole('button', { name: /create task/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/description must be 2000 characters or less/i)).toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' })
    })
    
    render(<TaskForm {...defaultProps} />)
    
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'New Task' }
    })
    
    const submitButton = screen.getByRole('button', { name: /create task/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/failed to create task/i)).toBeInTheDocument()
    })
  })

  it('should reset form after successful submission', async () => {
    render(<TaskForm {...defaultProps} />)
    
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'New Task' }
    })
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Description' }
    })
    
    const submitButton = screen.getByRole('button', { name: /create task/i })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalled()
    })
    
    expect(screen.getByLabelText(/title/i)).toHaveValue('')
    expect(screen.getByLabelText(/description/i)).toHaveValue('')
  })
})