import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  subtitle?: string
  action?: ReactNode
  icon?: string
}

export function EmptyState({ title, subtitle, action, icon = '🎞️' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-ink/20 bg-paper-secondary/50 px-6 py-16 text-center">
      <span className="text-3xl" aria-hidden>
        {icon}
      </span>
      <p className="font-display text-2xl font-semibold text-ink">{title}</p>
      {subtitle && <p className="max-w-sm font-sans text-sm text-ink/60">{subtitle}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
