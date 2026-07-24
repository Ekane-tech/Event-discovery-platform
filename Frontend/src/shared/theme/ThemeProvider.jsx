import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'theme'
const VALID_THEMES = ['light', 'dark', 'system']

function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (VALID_THEMES.includes(saved)) return saved
  return 'system'
}

export function ThemeProvider({ children }) {
  // `theme` is the user's choice ('light' | 'dark' | 'system');
  // `resolvedTheme` is what is actually rendered ('light' | 'dark').
  const [theme, setThemeState] = useState(getInitialTheme)
  const [systemTheme, setSystemTheme] = useState(getSystemTheme)

  // Track OS-level preference so "system" stays accurate.
  useEffect(() => {
    if (!window.matchMedia) return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event) => setSystemTheme(event.matches ? 'dark' : 'light')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const resolvedTheme = theme === 'system' ? systemTheme : theme

  // Apply the resolved theme to <html> and persist the user's choice.
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
    root.style.colorScheme = resolvedTheme
    if (theme === 'system') {
      window.localStorage.removeItem(STORAGE_KEY)
    } else {
      window.localStorage.setItem(STORAGE_KEY, theme)
    }
  }, [theme, resolvedTheme])

  const setTheme = useCallback((nextTheme) => {
    if (VALID_THEMES.includes(nextTheme)) setThemeState(nextTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const resolved = current === 'system' ? systemTheme : current
      return resolved === 'dark' ? 'light' : 'dark'
    })
  }, [systemTheme])

  const value = useMemo(
    () => ({ theme, resolvedTheme, systemTheme, setTheme, toggleTheme }),
    [theme, resolvedTheme, systemTheme, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }
  return context
}
