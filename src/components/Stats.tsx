interface StatItem {
  label: string
  value: string | number
}

function formatValue(value: string | number): string {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return String(value).padStart(3, '0')
  }
  return String(value)
}

export function Stats({ items }: { items: StatItem[] }) {
  return (
    <dl className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1.5 text-center">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-baseline gap-1.5">
          <dd className="font-display text-2xl font-semibold text-cherry">{formatValue(item.value)}</dd>
          <dt className="font-mono text-[11px] font-bold uppercase tracking-wide text-ink/50">{item.label}</dt>
          {i < items.length - 1 && (
            <span aria-hidden className="ml-1.5 text-ink/25">
              ·
            </span>
          )}
        </div>
      ))}
    </dl>
  )
}
