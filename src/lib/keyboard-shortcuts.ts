// Keyboard shortcut management system
export interface KeyboardShortcut {
  id: string
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  description: string
  action: () => void
  context?: string // 'global' | 'dashboard' | 'calendar' | 'form'
  preventDefault?: boolean
}

export interface ShortcutGroup {
  name: string
  shortcuts: KeyboardShortcut[]
}

export class KeyboardShortcutManager {
  private static instance: KeyboardShortcutManager
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private activeContext: string = 'global'
  private isEnabled: boolean = true

  static getInstance(): KeyboardShortcutManager {
    if (!KeyboardShortcutManager.instance) {
      KeyboardShortcutManager.instance = new KeyboardShortcutManager()
    }
    return KeyboardShortcutManager.instance
  }

  constructor() {
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return

    document.addEventListener('keydown', this.handleKeyDown.bind(this))
    
    // Listen for context changes
    document.addEventListener('focusin', this.handleFocusChange.bind(this))
    document.addEventListener('click', this.handleContextChange.bind(this))
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      // Allow certain global shortcuts even in inputs
      if (!this.isGlobalShortcut(event)) return
    }

    const shortcutKey = this.createShortcutKey(event)
    const shortcut = this.shortcuts.get(shortcutKey)

    if (shortcut && this.isShortcutActive(shortcut)) {
      if (shortcut.preventDefault !== false) {
        event.preventDefault()
      }
      shortcut.action()
    }
  }

  private isGlobalShortcut(event: KeyboardEvent): boolean {
    // Define which shortcuts should work even in input fields
    const globalKeys = ['Escape', 'F1', 'F2', 'F3', 'F4']
    return globalKeys.includes(event.key) || 
           (event.ctrlKey && ['n', 'k', 'z', 'y'].includes(event.key.toLowerCase()))
  }

  private handleFocusChange(event: FocusEvent): void {
    const target = event.target as HTMLElement
    
    if (target.closest('[data-context]')) {
      const context = target.closest('[data-context]')?.getAttribute('data-context')
      if (context) {
        this.setContext(context)
      }
    }
  }

  private handleContextChange(event: MouseEvent): void {
    const target = event.target as HTMLElement
    
    if (target.closest('[data-context]')) {
      const context = target.closest('[data-context]')?.getAttribute('data-context')
      if (context) {
        this.setContext(context)
      }
    }
  }

  private createShortcutKey(event: KeyboardEvent): string {
    const parts: string[] = []
    
    if (event.ctrlKey) parts.push('ctrl')
    if (event.altKey) parts.push('alt')
    if (event.shiftKey) parts.push('shift')
    if (event.metaKey) parts.push('meta')
    
    parts.push(event.key.toLowerCase())
    
    return parts.join('+')
  }

  private isShortcutActive(shortcut: KeyboardShortcut): boolean {
    if (!shortcut.context) return true
    
    return shortcut.context === 'global' || 
           shortcut.context === this.activeContext
  }

  register(shortcut: KeyboardShortcut): void {
    const key = this.createShortcutKeyFromShortcut(shortcut)
    
    if (this.shortcuts.has(key)) {
      console.warn(`Shortcut conflict: ${key} is already registered`)
    }
    
    this.shortcuts.set(key, shortcut)
  }

  unregister(shortcutId: string): void {
    for (const [key, shortcut] of this.shortcuts.entries()) {
      if (shortcut.id === shortcutId) {
        this.shortcuts.delete(key)
        break
      }
    }
  }

  private createShortcutKeyFromShortcut(shortcut: KeyboardShortcut): string {
    const parts: string[] = []
    
    if (shortcut.ctrlKey) parts.push('ctrl')
    if (shortcut.altKey) parts.push('alt')
    if (shortcut.shiftKey) parts.push('shift')
    if (shortcut.metaKey) parts.push('meta')
    
    parts.push(shortcut.key.toLowerCase())
    
    return parts.join('+')
  }

  setContext(context: string): void {
    this.activeContext = context
  }

  getContext(): string {
    return this.activeContext
  }

  enable(): void {
    this.isEnabled = true
  }

  disable(): void {
    this.isEnabled = false
  }

  getAllShortcuts(): ShortcutGroup[] {
    const groups: { [key: string]: KeyboardShortcut[] } = {}
    
    for (const shortcut of this.shortcuts.values()) {
      const context = shortcut.context || 'global'
      if (!groups[context]) {
        groups[context] = []
      }
      groups[context].push(shortcut)
    }

    return Object.entries(groups).map(([name, shortcuts]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      shortcuts: shortcuts.sort((a, b) => a.description.localeCompare(b.description))
    }))
  }

  getShortcutDisplay(shortcut: KeyboardShortcut): string {
    const parts: string[] = []
    const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
    
    if (shortcut.ctrlKey) parts.push(isMac ? '⌘' : 'Ctrl')
    if (shortcut.altKey) parts.push(isMac ? '⌥' : 'Alt')
    if (shortcut.shiftKey) parts.push(isMac ? '⇧' : 'Shift')
    if (shortcut.metaKey) parts.push(isMac ? '⌘' : 'Meta')
    
    // Format key display
    let keyDisplay = shortcut.key
    const keyMappings: { [key: string]: string } = {
      ' ': 'Space',
      'arrowup': '↑',
      'arrowdown': '↓',
      'arrowleft': '←',
      'arrowright': '→',
      'enter': '↵',
      'escape': 'Esc',
      'backspace': '⌫',
      'delete': 'Del',
      'tab': 'Tab'
    }
    
    if (keyMappings[keyDisplay.toLowerCase()]) {
      keyDisplay = keyMappings[keyDisplay.toLowerCase()]
    } else {
      keyDisplay = keyDisplay.toUpperCase()
    }
    
    parts.push(keyDisplay)
    
    return parts.join(isMac ? '' : '+')
  }
}

// Default keyboard shortcuts for the task app
export const createDefaultShortcuts = (callbacks: {
  // Global shortcuts
  openQuickAdd: () => void
  openSearch: () => void
  showHelp: () => void
  toggleTheme: () => void
  
  // Dashboard shortcuts
  createTask: () => void
  toggleTaskForm: () => void
  focusSearch: () => void
  
  // Task shortcuts
  markComplete: (taskId?: string) => void
  deleteTask: (taskId?: string) => void
  editTask: (taskId?: string) => void
  
  // Navigation shortcuts
  goToDashboard: () => void
  goToCalendar: () => void
  
  // Actions
  undo: () => void
  redo: () => void
  save: () => void
  cancel: () => void
}): KeyboardShortcut[] => {
  return [
    // Global shortcuts
    {
      id: 'quick-add',
      key: 'k',
      ctrlKey: true,
      description: 'Quick add task',
      action: callbacks.openQuickAdd,
      context: 'global'
    },
    {
      id: 'search',
      key: '/',
      description: 'Focus search',
      action: callbacks.focusSearch,
      context: 'global',
      preventDefault: false
    },
    {
      id: 'help',
      key: '?',
      shiftKey: true,
      description: 'Show keyboard shortcuts',
      action: callbacks.showHelp,
      context: 'global'
    },
    {
      id: 'theme-toggle',
      key: 't',
      ctrlKey: true,
      shiftKey: true,
      description: 'Toggle theme',
      action: callbacks.toggleTheme,
      context: 'global'
    },

    // Dashboard shortcuts
    {
      id: 'new-task',
      key: 'n',
      description: 'Create new task',
      action: callbacks.createTask,
      context: 'dashboard'
    },
    {
      id: 'toggle-form',
      key: 'Escape',
      description: 'Close/cancel form',
      action: callbacks.cancel,
      context: 'dashboard'
    },

    // Navigation shortcuts
    {
      id: 'goto-dashboard',
      key: '1',
      ctrlKey: true,
      description: 'Go to dashboard',
      action: callbacks.goToDashboard,
      context: 'global'
    },
    {
      id: 'goto-calendar',
      key: '2',
      ctrlKey: true,
      description: 'Go to calendar',
      action: callbacks.goToCalendar,
      context: 'global'
    },

    // Task actions
    {
      id: 'complete-task',
      key: 'c',
      description: 'Mark task complete',
      action: () => callbacks.markComplete(),
      context: 'dashboard'
    },
    {
      id: 'delete-task',
      key: 'Delete',
      description: 'Delete selected task',
      action: () => callbacks.deleteTask(),
      context: 'dashboard'
    },
    {
      id: 'edit-task',
      key: 'e',
      description: 'Edit selected task',
      action: () => callbacks.editTask(),
      context: 'dashboard'
    },

    // Action shortcuts
    {
      id: 'undo',
      key: 'z',
      ctrlKey: true,
      description: 'Undo last action',
      action: callbacks.undo,
      context: 'global'
    },
    {
      id: 'redo',
      key: 'y',
      ctrlKey: true,
      description: 'Redo last action',
      action: callbacks.redo,
      context: 'global'
    },
    {
      id: 'save',
      key: 's',
      ctrlKey: true,
      description: 'Save current form',
      action: callbacks.save,
      context: 'global'
    },

    // Navigation within lists
    {
      id: 'next-task',
      key: 'j',
      description: 'Select next task',
      action: () => {}, // Will be implemented in task list component
      context: 'dashboard'
    },
    {
      id: 'prev-task',
      key: 'k',
      description: 'Select previous task',
      action: () => {}, // Will be implemented in task list component
      context: 'dashboard'
    },

    // List navigation
    {
      id: 'all-tasks',
      key: 'a',
      description: 'Show all tasks',
      action: () => {}, // Will be implemented in sidebar
      context: 'dashboard'
    },
    {
      id: 'today-tasks',
      key: 't',
      description: 'Show today\'s tasks',
      action: () => {}, // Will be implemented in sidebar
      context: 'dashboard'
    }
  ]
}

export default KeyboardShortcutManager.getInstance()