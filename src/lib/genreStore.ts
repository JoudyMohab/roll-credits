import { useSyncExternalStore } from 'react'
import { getAllGenres } from '@/api/tmdb'
import type { Genre } from '@/types/media'

let genres: Genre[] = []
let fetched = false
const listeners = new Set<() => void>()

function notify() {
  for (const cb of listeners) cb()
}

function ensureFetched() {
  if (fetched) return
  fetched = true
  getAllGenres()
    .then((g) => {
      genres = g
      notify()
    })
    .catch(() => {
      /* genres are cosmetic; failures degrade gracefully to id-less labels */
    })
}

export function useGenres(): Genre[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      ensureFetched()
      return () => listeners.delete(cb)
    },
    () => genres,
    () => genres,
  )
}

export function genreNamesFromIds(ids: number[], list: Genre[]): string[] {
  const map = new Map(list.map((g) => [g.id, g.name]))
  return ids.map((id) => map.get(id)).filter((n): n is string => Boolean(n))
}
