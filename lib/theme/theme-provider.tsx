'use client'

import * as React from 'react'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>('auto')
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>('light')

  // Load theme from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored && ['light', 'dark', 'auto'].includes(stored)) {
      setThemeState(stored)
    }
  }, [])

  // Update resolved theme based on theme setting and system preference
  React.useEffect(() => {
    const updateResolvedTheme = () => {
      if (theme === 'auto') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setResolvedTheme(systemPrefersDark ? 'dark' : 'light')
      } else {
        setResolvedTheme(theme)
      }
    }

    updateResolvedTheme()

    // Listen for system theme changes when in auto mode
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => updateResolvedTheme()
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [theme])

  // Apply theme to document. Set data-theme-transition briefly so the
  // smooth color transition only fires on intentional theme toggles, not
  // on every hover/focus interaction across the app.
  const isFirstApply = React.useRef(true)
  React.useEffect(() => {
    const root = document.documentElement
    if (!isFirstApply.current) {
      root.setAttribute('data-theme-transition', '')
    }
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
    root.setAttribute('data-theme', resolvedTheme)
    if (!isFirstApply.current) {
      const t = window.setTimeout(() => {
        root.removeAttribute('data-theme-transition')
      }, 250)
      return () => window.clearTimeout(t)
    }
    isFirstApply.current = false
  }, [resolvedTheme])

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }, [])

  const value = React.useMemo(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
