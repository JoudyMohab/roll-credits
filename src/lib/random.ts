import type { LibraryEntry, PickerMode, PickerScope } from '@/types/library'

export function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null
  return arr[Math.floor(Math.random() * arr.length)]
}

export function getPickerPool(
  entries: LibraryEntry[],
  mode: PickerMode,
  scope: PickerScope,
  selectionPool?: LibraryEntry[],
): LibraryEntry[] {
  if (mode === 'selection') return selectionPool ?? []
  let pool = entries.filter((e) => !e.upcoming)
  if (scope !== 'all') pool = pool.filter((e) => e.mediaType === scope)
  switch (mode) {
    case 'unwatched':
      return pool.filter((e) => !e.watched)
    case 'everything':
      return pool
    case 'favorites':
      return pool.filter((e) => e.favorite)
    default:
      return pool
  }
}
