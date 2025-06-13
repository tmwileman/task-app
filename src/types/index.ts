import { Priority, Task, TaskList, Tag, User } from '@prisma/client'

// Extended types with relations
export type TaskWithRelations = Task & {
  list?: TaskList | null
  parent?: Task | null
  subtasks?: Task[]
  tags?: (TaskTag & { tag: Tag })[]
}

export type TaskListWithRelations = TaskList & {
  tasks?: Task[]
  _count?: {
    tasks: number
  }
}

export type TaskTag = {
  taskId: string
  tagId: string
  tag: Tag
}

// Form types
export type CreateTaskData = {
  title: string
  description?: string
  priority?: Priority
  dueDate?: Date
  listId?: string
  parentId?: string
}

export type UpdateTaskData = Partial<{
  title: string
  description: string
  completed: boolean
  priority: Priority
  dueDate: Date
  reminder: Date
  listId: string
  order: number
}>

export type CreateTaskListData = {
  name: string
  description?: string
  color?: string
}

export type CreateTagData = {
  name: string
  color?: string
}

// Dashboard types
export type DashboardData = {
  totalTasks: number
  lists: TaskListWithRelations[]
  overdueTasks: TaskWithRelations[]
  todayTasks: TaskWithRelations[]
  upcomingTasks: TaskWithRelations[]
}

// Filter types
export type TaskFilters = {
  listId?: string
  completed?: boolean
  priority?: Priority
  search?: string
  tags?: string[]
}

// API Response types
export type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Component prop types
export type TaskItemProps = {
  task: TaskWithRelations
  onUpdate: (taskId: string, data: UpdateTaskData) => void
  onDelete: (taskId: string) => void
  showList?: boolean
}

export type TaskListProps = {
  tasks: TaskWithRelations[]
  loading?: boolean
  onTaskUpdate: (taskId: string, data: UpdateTaskData) => void
  onTaskDelete: (taskId: string) => void
}

// Form validation types
export type ValidationError = {
  field: string
  message: string
}

export type FormState<T> = {
  data: T
  errors: ValidationError[]
  isSubmitting: boolean
  isValid: boolean
}

// Calendar types
export type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  allDay?: boolean
  resource?: TaskWithRelations
}

// Notification types
export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export type Notification = {
  id: string
  type: NotificationType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Theme types
export type Theme = 'light' | 'dark' | 'system'

// User preferences
export type UserPreferences = {
  theme: Theme
  defaultListId?: string
  reminderDefaults: {
    enabled: boolean
    minutesBefore: number
  }
  notifications: {
    browser: boolean
    email: boolean
  }
}