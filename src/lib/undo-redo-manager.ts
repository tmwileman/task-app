// Undo/Redo management system for task operations
export interface UndoableAction {
  id: string
  type: 'create' | 'update' | 'delete' | 'bulk'
  description: string
  timestamp: Date
  undo: () => Promise<void>
  redo: () => Promise<void>
  data?: any // Store any additional data needed for the action
}

export class UndoRedoManager {
  private static instance: UndoRedoManager
  private undoStack: UndoableAction[] = []
  private redoStack: UndoableAction[] = []
  private maxStackSize: number = 50
  private listeners: Set<() => void> = new Set()

  static getInstance(): UndoRedoManager {
    if (!UndoRedoManager.instance) {
      UndoRedoManager.instance = new UndoRedoManager()
    }
    return UndoRedoManager.instance
  }

  addAction(action: UndoableAction): void {
    // Clear redo stack when new action is added
    this.redoStack = []
    
    // Add to undo stack
    this.undoStack.push(action)
    
    // Limit stack size
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift()
    }
    
    this.notifyListeners()
  }

  async undo(): Promise<boolean> {
    if (this.undoStack.length === 0) {
      return false
    }

    const action = this.undoStack.pop()!
    
    try {
      await action.undo()
      this.redoStack.push(action)
      this.notifyListeners()
      return true
    } catch (error) {
      console.error('Failed to undo action:', error)
      // Put the action back on the stack if undo failed
      this.undoStack.push(action)
      throw error
    }
  }

  async redo(): Promise<boolean> {
    if (this.redoStack.length === 0) {
      return false
    }

    const action = this.redoStack.pop()!
    
    try {
      await action.redo()
      this.undoStack.push(action)
      this.notifyListeners()
      return true
    } catch (error) {
      console.error('Failed to redo action:', error)
      // Put the action back on the stack if redo failed
      this.redoStack.push(action)
      throw error
    }
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  getUndoDescription(): string | null {
    if (this.undoStack.length === 0) return null
    return this.undoStack[this.undoStack.length - 1].description
  }

  getRedoDescription(): string | null {
    if (this.redoStack.length === 0) return null
    return this.redoStack[this.redoStack.length - 1].description
  }

  clear(): void {
    this.undoStack = []
    this.redoStack = []
    this.notifyListeners()
  }

  // Get recent actions for display
  getRecentActions(limit: number = 10): UndoableAction[] {
    return this.undoStack.slice(-limit).reverse()
  }

  // Subscribe to changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener())
  }
}

// Factory functions for creating common undoable actions
export const createTaskActions = {
  create: (
    task: any,
    onUndo: (taskId: string) => Promise<void>,
    onRedo: (taskData: any) => Promise<any>
  ): UndoableAction => ({
    id: `create-${task.id}-${Date.now()}`,
    type: 'create',
    description: `Create "${task.title}"`,
    timestamp: new Date(),
    data: { task },
    undo: async () => {
      await onUndo(task.id)
    },
    redo: async () => {
      await onRedo(task)
    }
  }),

  update: (
    taskId: string,
    oldData: any,
    newData: any,
    onUpdate: (taskId: string, data: any) => Promise<void>
  ): UndoableAction => ({
    id: `update-${taskId}-${Date.now()}`,
    type: 'update',
    description: `Update "${oldData.title || 'task'}"`,
    timestamp: new Date(),
    data: { taskId, oldData, newData },
    undo: async () => {
      await onUpdate(taskId, oldData)
    },
    redo: async () => {
      await onUpdate(taskId, newData)
    }
  }),

  delete: (
    task: any,
    onRestore: (taskData: any) => Promise<any>,
    onDelete: (taskId: string) => Promise<void>
  ): UndoableAction => ({
    id: `delete-${task.id}-${Date.now()}`,
    type: 'delete',
    description: `Delete "${task.title}"`,
    timestamp: new Date(),
    data: { task },
    undo: async () => {
      await onRestore(task)
    },
    redo: async () => {
      await onDelete(task.id)
    }
  }),

  bulkComplete: (
    tasks: any[],
    onUpdate: (taskId: string, data: any) => Promise<void>
  ): UndoableAction => ({
    id: `bulk-complete-${Date.now()}`,
    type: 'bulk',
    description: `Complete ${tasks.length} task${tasks.length > 1 ? 's' : ''}`,
    timestamp: new Date(),
    data: { tasks },
    undo: async () => {
      await Promise.all(
        tasks.map(task => onUpdate(task.id, { completed: false }))
      )
    },
    redo: async () => {
      await Promise.all(
        tasks.map(task => onUpdate(task.id, { completed: true }))
      )
    }
  }),

  bulkDelete: (
    tasks: any[],
    onRestore: (taskData: any) => Promise<any>,
    onDelete: (taskId: string) => Promise<void>
  ): UndoableAction => ({
    id: `bulk-delete-${Date.now()}`,
    type: 'bulk',
    description: `Delete ${tasks.length} task${tasks.length > 1 ? 's' : ''}`,
    timestamp: new Date(),
    data: { tasks },
    undo: async () => {
      await Promise.all(
        tasks.map(task => onRestore(task))
      )
    },
    redo: async () => {
      await Promise.all(
        tasks.map(task => onDelete(task.id))
      )
    }
  })
}

export default UndoRedoManager.getInstance()