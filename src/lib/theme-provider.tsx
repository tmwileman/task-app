'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'dark' | 'light' // The actual resolved theme (system resolves to dark or light)
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string
  disableTransitionOnChange?: boolean
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'task-app-theme',
  attribute = 'class',
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [actualTheme, setActualTheme] = useState<'dark' | 'light'>('light')

  useEffect(() => {
    // Load theme from localStorage on mount
    const stored = localStorage.getItem(storageKey) as Theme
    if (stored && ['dark', 'light', 'system'].includes(stored)) {
      setThemeState(stored)
    }
  }, [storageKey])

  useEffect(() => {
    const root = window.document.documentElement

    // Temporarily disable transitions
    if (disableTransitionOnChange) {
      root.classList.add('[&_*]:!transition-none')
    }

    // Remove previous theme classes
    root.classList.remove('light', 'dark')

    let resolvedTheme: 'dark' | 'light'

    if (theme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    } else {
      resolvedTheme = theme
    }

    // Apply theme
    if (attribute === 'class') {
      root.classList.add(resolvedTheme)
    } else {
      root.setAttribute(attribute, resolvedTheme)
    }

    setActualTheme(resolvedTheme)

    // Re-enable transitions
    if (disableTransitionOnChange) {
      setTimeout(() => {
        root.classList.remove('[&_*]:!transition-none')
      }, 1)
    }
  }, [theme, attribute, disableTransitionOnChange])

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      if (theme === 'system') {
        const resolvedTheme = mediaQuery.matches ? 'dark' : 'light'
        setActualTheme(resolvedTheme)
        
        const root = window.document.documentElement
        root.classList.remove('light', 'dark')
        
        if (attribute === 'class') {
          root.classList.add(resolvedTheme)
        } else {
          root.setAttribute(attribute, resolvedTheme)
        }
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, attribute])

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme)
    setThemeState(newTheme)
  }

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light')
    } else if (theme === 'light') {
      setTheme('system')
    } else {
      setTheme('dark')
    }
  }

  const value: ThemeContextType = {
    theme,
    setTheme,
    actualTheme,
    toggleTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// Theme toggle button component
interface ThemeToggleProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function ThemeToggle({ className = '', size = 'md', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme, actualTheme } = useTheme()

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const getIcon = () => {
    if (theme === 'system') {
      return (
        <svg className={iconSizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    } else if (actualTheme === 'dark') {
      return (
        <svg className={iconSizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )
    } else {
      return (
        <svg className={iconSizeClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    }
  }

  const getLabel = () => {
    if (theme === 'system') return 'System'
    return actualTheme === 'dark' ? 'Dark' : 'Light'
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${sizeClasses[size]} 
        inline-flex items-center justify-center rounded-md
        text-gray-600 hover:text-gray-900 hover:bg-gray-100
        dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800
        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      title={`Current theme: ${getLabel()}. Click to toggle.`}
    >
      {getIcon()}
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {getLabel()}
        </span>
      )}
    </button>
  )
}

// Hook to detect system theme preference
export function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>('light')

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    }

    updateSystemTheme()
    mediaQuery.addEventListener('change', updateSystemTheme)
    
    return () => mediaQuery.removeEventListener('change', updateSystemTheme)
  }, [])

  return systemTheme
}

// Theme detection for SSR
export function getInitialTheme(storageKey = 'task-app-theme') {
  if (typeof window === 'undefined') return 'light'

  try {
    const stored = localStorage.getItem(storageKey)
    if (stored && ['dark', 'light', 'system'].includes(stored)) {
      if (stored === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return stored as 'dark' | 'light'
    }
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error)
  }

  // Default to system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Script to inject in document head to prevent flash
export const themeScript = `
(function() {
  function getTheme() {
    try {
      const stored = localStorage.getItem('task-app-theme');
      if (stored && ['dark', 'light', 'system'].includes(stored)) {
        if (stored === 'system') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return stored;
      }
    } catch (e) {}
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  const theme = getTheme();
  document.documentElement.classList.add(theme);
})();
`