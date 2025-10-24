import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface UseThemeReturn {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const STORAGE_KEY = 'theme-preference'

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [isClient, setIsClient] = useState(false)

  // Initialize from localStorage and detect system preference
  useEffect(() => {
    setIsClient(true)

    // Get stored preference or default to system
    const storedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null
    const initialTheme = storedTheme || 'system'
    setThemeState(initialTheme)

    // Determine resolved theme (actual theme to apply)
    const determineResolvedTheme = (): 'light' | 'dark' => {
      if (initialTheme !== 'system') {
        return initialTheme
      }

      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
      return 'light'
    }

    const resolved = determineResolvedTheme()
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }, [])

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      const newResolvedTheme = e.matches ? 'dark' : 'light'
      setResolvedTheme(newResolvedTheme)
      applyTheme(newResolvedTheme)
    }

    // Modern API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    // Fallback for older browsers
    mediaQuery.addListener(handleChange)
    return () => mediaQuery.removeListener(handleChange)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)

    // Determine resolved theme
    let resolved: 'light' | 'dark'
    if (newTheme === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        resolved = 'dark'
      } else {
        resolved = 'light'
      }
    } else {
      resolved = newTheme
    }

    setResolvedTheme(resolved)
    applyTheme(resolved)
  }

  return {
    theme: isClient ? theme : 'system',
    setTheme,
    resolvedTheme,
  }
}

function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement

  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}
