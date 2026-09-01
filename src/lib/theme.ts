import { useCallback, useEffect, useState } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'rollcredits.theme'

export function getStoredPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(pref: ThemePreference): void {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  if (pref !== 'system') root.classList.add(pref)
  try {
    localStorage.setItem(STORAGE_KEY, pref)
  } catch {
    /* storage unavailable — theme still applies for this page load */
  }
}

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function useThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>(getStoredPreference)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    applyTheme(preference)
  }, [preference])

  const isDark = preference === 'system' ? systemDark : preference === 'dark'

  const toggle = useCallback(() => {
    setPreference(isDark ? 'light' : 'dark')
  }, [isDark])

  return { isDark, toggle }
}
