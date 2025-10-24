import { ReactNode } from 'react'
import { useTheme } from '@/hooks/use-theme'
import { ThemeContext } from './theme-context'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
