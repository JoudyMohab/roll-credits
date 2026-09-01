import { useSyncExternalStore } from 'react'
import { getMediaDetails, hasTmdbKey } from '@/api/tmdb'
import type { MediaDetails, MediaType } from '@/types/media'
import { mediaKey } from '@/types/media'
import { loadJSON, saveJSON } from './storage'

type DetailsState = {
  data?: MediaDetails
  loading: boolean
  error?: string
}

const EMPTY_STATE: DetailsState = { loading: false }

const cache = new Map<string, DetailsState>(
  Object.entries(loadJSON<Record<string, MediaDetails>>('detailsCache', {})).map(([k, v]) => [
    k,
    { data: v, loading: false },
  ]),
)

const listeners = new Map<string, Set<() => void>>()

function notify(key: string) {
  for (const cb of listeners.get(key) ?? []) cb()
}

function persist() {
  const plain: Record<string, MediaDetails> = {}
  for (const [k, v] of cache.entries()) {
    if (v.data) plain[k] = v.data
  }
  saveJSON('detailsCache', plain)
}

const queue: string[] = []
const inFlight = new Set<string>()
const MAX_CONCURRENT = 4
let active = 0

function enqueue(mediaType: MediaType, id: number) {
  const key = mediaKey(mediaType, id)
  if (cache.get(key)?.data || inFlight.has(key)) return
  if (!queue.includes(key)) queue.push(key)
  pump()
}

function pump() {
  if (!hasTmdbKey()) return
  while (active < MAX_CONCURRENT && queue.length > 0) {
    const key = queue.shift()
    if (!key) continue
    const [mediaType, idStr] = key.split('-') as [MediaType, string]
    const id = Number(idStr)
    inFlight.add(key)
    active++
    cache.set(key, { ...(cache.get(key) ?? { loading: false }), loading: true })
    notify(key)
    getMediaDetails(mediaType, id)
      .then((data) => {
        cache.set(key, { data, loading: false })
        persist()
      })
      .catch((err: unknown) => {
        cache.set(key, { loading: false, error: err instanceof Error ? err.message : 'Failed to load' })
      })
      .finally(() => {
        active--
        inFlight.delete(key)
        notify(key)
        pump()
      })
  }
}

export function getCachedDetails(mediaType: MediaType, id: number): MediaDetails | undefined {
  return cache.get(mediaKey(mediaType, id))?.data
}

export function primeDetailsCache(mediaType: MediaType, id: number, details: MediaDetails): void {
  cache.set(mediaKey(mediaType, id), { data: details, loading: false })
  persist()
  notify(mediaKey(mediaType, id))
}

export function useMediaDetailsCache(mediaType: MediaType, id: number): DetailsState {
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
