import { useSyncExternalStore } from 'react'
import { getWatchAvailability, hasTmdbKey } from '@/api/tmdb'
import type { CountryWatchAvailability } from '@/api/tmdb'
import type { MediaType } from '@/types/media'
import { mediaKey } from '@/types/media'

type AvailabilityState = {
  /** undefined = not yet resolved, null = confirmed no availability in this country */
  data?: CountryWatchAvailability | null
  loading: boolean
  error?: string
}

const EMPTY_STATE: AvailabilityState = { loading: false }

// Deliberately in-memory only (no localStorage) — unlike static movie/show metadata,
// streaming availability changes over time and should be re-checked each session
// rather than persisted as personal library data.
const cache = new Map<string, AvailabilityState>()
const listeners = new Map<string, Set<() => void>>()
const inFlight = new Set<string>()

function notify(key: string) {
  for (const cb of listeners.get(key) ?? []) cb()
}

function enqueue(mediaType: MediaType, id: number) {
  const key = mediaKey(mediaType, id)
  if (cache.has(key) || inFlight.has(key) || !hasTmdbKey()) return
  inFlight.add(key)
  cache.set(key, { loading: true })
  notify(key)
  getWatchAvailability(mediaType, id, 'EG')
    .then((data) => cache.set(key, { data, loading: false }))
    .catch((err: unknown) => {
      cache.set(key, { loading: false, error: err instanceof Error ? err.message : 'Failed to load' })
    })
    .finally(() => {
      inFlight.delete(key)
      notify(key)
    })
}

export function useWatchAvailability(mediaType: MediaType, id: number): AvailabilityState {
  const key = mediaKey(mediaType, id)
  const getSnapshot = () => cache.get(key) ?? EMPTY_STATE
  return useSyncExternalStore(
    (cb) => {
      if (!listeners.has(key)) listeners.set(key, new Set())
      listeners.get(key)!.add(cb)
      enqueue(mediaType, id)
      return () => listeners.get(key)?.delete(cb)
    },
    getSnapshot,
    getSnapshot,
  )
}
