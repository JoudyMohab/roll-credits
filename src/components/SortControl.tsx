import type { SortKey } from '@/types/library'

const OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'a-z', label: 'A–Z' },
  { key: 'z-a', label: 'Z–A' },
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'tmdb-rating', label: 'TMDB Rating' },
  { key: 'personal-rating', label: 'My Rating' },
]

interface SortControlProps {
  value: SortKey
  onChange: (key: SortKey) => void
}

export function SortControl({ value, onChange }: SortControlProps) {
  return (
    <label className="flex items-center gap-2">
      <span className="font-mono text-[11px] font-bold uppercase tracking-wide text-ink/50">Sort</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="rounded-full border border-ink/20 bg-paper px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-ink/70 focus-visible:border-cherry"
      >
        {OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function sortEntries<T extends { cache: { title: string; year: number | null; voteAverage: number }; rating: number | null; addedAt: string }>(
  entries: T[],
  key: SortKey,
): T[] {
  const copy = [...entries]
  switch (key) {
    case 'a-z':
      return copy.sort((a, b) => a.cache.title.localeCompare(b.cache.title))
    case 'z-a':
      return copy.sort((a, b) => b.cache.title.localeCompare(a.cache.title))
    case 'newest':
      return copy.sort((a, b) => (b.cache.year ?? 0) - (a.cache.year ?? 0))
    case 'oldest':
      return copy.sort((a, b) => (a.cache.year ?? 9999) - (b.cache.year ?? 9999))
    case 'tmdb-rating':
      return copy.sort((a, b) => b.cache.voteAverage - a.cache.voteAverage)
    case 'personal-rating':
      return copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    default:
      return copy
  }
}
