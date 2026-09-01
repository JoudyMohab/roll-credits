import { useThemeToggle } from '@/lib/theme'

export function ThemeToggle() {
  const { isDark, toggle } = useThemeToggle()

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/20 text-base text-ink/70 transition-colors hover:border-cherry hover:text-cherry"
    >
      <span aria-hidden>{isDark ? '☀️' : '🌙'}</span>
    </button>
  )
}
