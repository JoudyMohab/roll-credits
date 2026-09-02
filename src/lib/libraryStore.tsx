import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { LibraryEntry } from '@/types/library'
import type { MediaSummary, MediaType } from '@/types/media'
import { isMovie, mediaKey } from '@/types/media'
import type { SeedReviewItem } from '@/types/seed'
import { loadJSON, saveJSON } from './storage'
import { makeTicketMeta } from './ticketMeta'
import { useAuth } from './authStore'
import {
  deleteCloudEntry,
  fetchCloudEntries,
  subscribeToCloudChanges,
  upsertCloudEntry,
  type CloudEntryData,
} from './cloudLibrary'
import seedResolved from '@/data/seed-resolved.json'
import seedReview from '@/data/seed-review.json'
import type { SeedResolvedItem } from '@/types/seed'

const SYNC_ERROR_MESSAGE = "Your change couldn't be synced right now. We'll try again."
const EMPTY_ENTRIES: Record<string, LibraryEntry> = {}

interface PersistedState {
  entries: Record<string, LibraryEntry>
  nextScreeningNumber: number
  reviewItems: SeedReviewItem[]
  /** raw seed keys (declaredType-rawTitle) already imported or resolved/discarded from review,
   *  so re-running the resolve script or reloading the bundled seed data never re-adds them. */
  seenSeedKeys: string[]
}

function seedReviewKey(item: Pick<SeedReviewItem, 'declaredType' | 'rawTitle'>): string {
  return `${item.declaredType}-${item.rawTitle}`
}

type Action =
  | { type: 'ADD'; media: MediaSummary; watchlisted?: boolean }
  | { type: 'REMOVE'; key: string }
  | { type: 'SET_WATCHED'; key: string; watched: boolean }
  | { type: 'SET_WATCHLISTED'; key: string; watchlisted: boolean }
  | { type: 'SET_RATING'; key: string; rating: number | null }
  | { type: 'SET_NOTE'; key: string; note: string }
  | { type: 'TOGGLE_FAVORITE'; key: string }
  | { type: 'RESOLVE_REVIEW'; index: number; media: MediaSummary | null }

function emptyState(): PersistedState {
  return { entries: {}, nextScreeningNumber: 1, reviewItems: [], seenSeedKeys: [] }
}

function buildEntryFromSeed(item: SeedResolvedItem, screeningNumber: number): LibraryEntry {
  const key = mediaKey(item.mediaType, item.tmdbId)
  return {
    tmdbId: item.tmdbId,
    mediaType: item.mediaType,
    addedAt: new Date().toISOString(),
    watchlisted: true,
    watched: item.watched,
    watchedAt: null,
    rating: null,
    note: '',
    favorite: false,
    upcoming: item.upcoming,
    cache: {
      title: item.title,
      posterPath: null,
      year: item.year,
      genreIds: item.genreIds,
      voteAverage: 0,
    },
    ticket: makeTicketMeta(key, screeningNumber),
  }
}

function buildEntryFromMedia(media: MediaSummary, screeningNumber: number, watchlisted = true): LibraryEntry {
  const key = mediaKey(media.mediaType, media.id)
  const year = isMovie(media)
    ? media.releaseDate
      ? Number(media.releaseDate.slice(0, 4))
      : null
    : media.firstAirDate
      ? Number(media.firstAirDate.slice(0, 4))
      : null
  const upcoming = isMovie(media) ? !media.releaseDate : !media.firstAirDate
  return {
    tmdbId: media.id,
    mediaType: media.mediaType,
    addedAt: new Date().toISOString(),
    watchlisted,
    watched: false,
    watchedAt: null,
    rating: null,
    note: '',
    favorite: false,
    upcoming,
    cache: {
      title: media.title,
      posterPath: media.posterPath,
      year,
      genreIds: media.genreIds,
      voteAverage: media.voteAverage,
    },
    ticket: makeTicketMeta(key, screeningNumber),
  }
}

function init(): PersistedState {
  const base = loadJSON<PersistedState | null>('library', null) ?? emptyState()
  let screeningNumber = base.nextScreeningNumber
  const entries = { ...base.entries }
  const seen = new Set(base.seenSeedKeys)

  for (const item of seedResolved as SeedResolvedItem[]) {
    const seedKey = seedReviewKey({ declaredType: item.declaredType, rawTitle: item.rawTitle })
    if (seen.has(seedKey)) continue
    seen.add(seedKey)
    const key = mediaKey(item.mediaType, item.tmdbId)
    if (entries[key]) continue
    entries[key] = buildEntryFromSeed(item, screeningNumber++)
  }

  const reviewItems = [...base.reviewItems]
  for (const item of seedReview as SeedReviewItem[]) {
    const seedKey = seedReviewKey(item)
    if (seen.has(seedKey)) continue
    seen.add(seedKey)
    reviewItems.push(item)
  }

  return {
    entries,
    nextScreeningNumber: screeningNumber,
    reviewItems,
    seenSeedKeys: [...seen],
  }
}

function reducer(state: PersistedState, action: Action): PersistedState {
  switch (action.type) {
    case 'ADD': {
      const key = mediaKey(action.media.mediaType, action.media.id)
      if (state.entries[key]) return state
      return {
        ...state,
        entries: {
          ...state.entries,
          [key]: buildEntryFromMedia(action.media, state.nextScreeningNumber, action.watchlisted ?? true),
        },
        nextScreeningNumber: state.nextScreeningNumber + 1,
      }
    }
    case 'REMOVE': {
      const { [action.key]: _removed, ...rest } = state.entries
      return { ...state, entries: rest }
    }
    case 'SET_WATCHLISTED': {
      const entry = state.entries[action.key]
      if (!entry) return state
      return { ...state, entries: { ...state.entries, [action.key]: { ...entry, watchlisted: action.watchlisted } } }
    }
    case 'SET_WATCHED': {
      const entry = state.entries[action.key]
      if (!entry) return state
      return {
        ...state,
        entries: {
          ...state.entries,
          [action.key]: {
            ...entry,
            watched: action.watched,
            watchedAt: action.watched ? (entry.watchedAt ?? new Date().toISOString()) : entry.watchedAt,
          },
        },
      }
    }
    case 'SET_RATING': {
      const entry = state.entries[action.key]
      if (!entry) return state
      return { ...state, entries: { ...state.entries, [action.key]: { ...entry, rating: action.rating } } }
    }
    case 'SET_NOTE': {
      const entry = state.entries[action.key]
      if (!entry) return state
      return { ...state, entries: { ...state.entries, [action.key]: { ...entry, note: action.note } } }
    }
    case 'TOGGLE_FAVORITE': {
      const entry = state.entries[action.key]
      if (!entry) return state
      return { ...state, entries: { ...state.entries, [action.key]: { ...entry, favorite: !entry.favorite } } }
    }
    case 'RESOLVE_REVIEW': {
      const target = state.reviewItems[action.index]
      const reviewItems = state.reviewItems.filter((_, i) => i !== action.index)
      const seenSeedKeys = target ? [...state.seenSeedKeys, seedReviewKey(target)] : state.seenSeedKeys
      if (!action.media) return { ...state, reviewItems, seenSeedKeys }
      const key = mediaKey(action.media.mediaType, action.media.id)
      if (state.entries[key]) return { ...state, reviewItems, seenSeedKeys }
      const entry = buildEntryFromMedia(action.media, state.nextScreeningNumber)
      return {
        ...state,
        reviewItems,
        seenSeedKeys,
        entries: {
          ...state.entries,
          [key]: target?.watched ? { ...entry, watched: true, watchedAt: new Date().toISOString() } : entry,
        },
        nextScreeningNumber: state.nextScreeningNumber + 1,
      }
    }
    default:
      return state
  }
}

function toCloudData(entry: LibraryEntry): CloudEntryData {
  const { ticket: _ticket, ...data } = entry
  return data
}

function cloudDataToEntries(data: CloudEntryData[]): Record<string, LibraryEntry> {
  const sorted = [...data].sort((a, b) => a.addedAt.localeCompare(b.addedAt))
  const entries: Record<string, LibraryEntry> = {}
  sorted.forEach((d, i) => {
    const key = mediaKey(d.mediaType, d.tmdbId)
    entries[key] = { ...d, ticket: makeTicketMeta(key, i + 1) }
  })
  return entries
}

/**
 * Deterministic merge used the one time a signed-in user chooses to bring their
 * anonymous, on-this-device data ("local") into their cloud account, which may
 * already hold data of its own ("cloud"). Rules, applied field by field:
 *  - watchlisted / watched: true if EITHER side says true — never un-watches
 *    or un-watchlists something as a side effect of merging.
 *  - watchedAt: the earlier of the two dates, since that's when the screening
 *    actually happened; falls back to whichever side has one set.
 *  - rating: local wins when both sides rated it, since bringing this device's
 *    data in is an explicit, deliberate action; falls back to whichever side has one.
 *  - note: if both sides wrote a different note, keep both (cloud, then local)
 *    rather than silently discarding one.
 *  - favorite: true if either side says true.
 *  - cache / upcoming: local wins, since it reflects the most recent TMDB read.
 */
function mergeEntries(cloudEntry: LibraryEntry | undefined, localEntry: LibraryEntry): LibraryEntry {
  if (!cloudEntry) return localEntry
  const watchedAt =
    cloudEntry.watchedAt && localEntry.watchedAt
      ? cloudEntry.watchedAt < localEntry.watchedAt
        ? cloudEntry.watchedAt
        : localEntry.watchedAt
      : (localEntry.watchedAt ?? cloudEntry.watchedAt)
  const note =
    cloudEntry.note && localEntry.note && cloudEntry.note !== localEntry.note
      ? `${cloudEntry.note}\n\n${localEntry.note}`
      : localEntry.note || cloudEntry.note
  return {
    ...cloudEntry,
    watchlisted: cloudEntry.watchlisted || localEntry.watchlisted,
    watched: cloudEntry.watched || localEntry.watched,
    watchedAt,
    rating: localEntry.rating ?? cloudEntry.rating,
    note,
    favorite: cloudEntry.favorite || localEntry.favorite,
    upcoming: localEntry.upcoming,
    cache: localEntry.cache,
    addedAt: cloudEntry.addedAt < localEntry.addedAt ? cloudEntry.addedAt : localEntry.addedAt,
  }
}

interface LibraryContextValue {
  entries: LibraryEntry[]
  entryMap: Record<string, LibraryEntry>
  reviewItems: SeedReviewItem[]
  addToWatchlist: (media: MediaSummary) => void
  addToLibrary: (media: MediaSummary, options?: { watchlisted?: boolean }) => void
  removeFromLibrary: (mediaType: MediaType, id: number) => void
  setWatched: (mediaType: MediaType, id: number, watched: boolean) => void
  setWatchlisted: (mediaType: MediaType, id: number, watchlisted: boolean) => void
  setRating: (mediaType: MediaType, id: number, rating: number | null) => void
  setNote: (mediaType: MediaType, id: number, note: string) => void
  toggleFavorite: (mediaType: MediaType, id: number) => void
  resolveReviewItem: (index: number, media: MediaSummary | null) => void
  isInLibrary: (mediaType: MediaType, id: number) => boolean
  getEntry: (mediaType: MediaType, id: number) => LibraryEntry | undefined
  /** True once signed in and this account's cloud library is the active source of truth. */
  isCloudSynced: boolean
  syncError: string | null
  isSyncing: boolean
  /** Local (anonymous) entries found on sign-in, offered for a one-time merge into the cloud. */
  pendingMigration: LibraryEntry[] | null
  resolveMigration: (sync: boolean) => void
}

const LibraryContext = createContext<LibraryContextValue | null>(null)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()
  const [state, localDispatch] = useReducer(reducer, undefined, init)

  const [cloudEntries, setCloudEntriesState] = useState<Record<string, LibraryEntry> | null>(null)
  const [pendingMigration, setPendingMigration] = useState<LibraryEntry[] | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // Screening actions often fire several mutations back to back in one handler
  // (mark watched, then rate, then add a note). Those calls all execute before
  // React re-renders, so reading `cloudEntries` state directly would have every
  // call see the same stale snapshot and clobber each other's writes. This ref
  // is updated synchronously alongside the state so each chained call sees the
  // previous one's result immediately.
  const cloudEntriesSnapshot = useRef<Record<string, LibraryEntry> | null>(null)
  function setCloudEntries(value: Record<string, LibraryEntry> | null) {
    cloudEntriesSnapshot.current = value
    setCloudEntriesState(value)
  }

  const isCloudSynced = status === 'signedIn' && cloudEntries !== null

  // Anonymous/local mode persists exactly as before. While signed in, the local
  // reducer just sits idle in memory — we never write cloud data over it, so it's
  // intact and ready the moment the user signs out again.
  useEffect(() => {
    if (status === 'signedIn') return
    saveJSON('library', state)
  }, [state, status])

  useEffect(() => {
    if (status !== 'signedIn' || !user) {
      setCloudEntries(null)
      setPendingMigration(null)
      return
    }
    let cancelled = false
    // Clear out whatever was loaded before this effect run — if this fired because
    // the signed-in user changed (e.g. a shared browser session switched accounts
    // in another tab), the previous account's entries must never linger on screen
    // while the new account's library is fetched.
    setCloudEntries(null)
    const localEntriesAtSignIn = Object.values(state.entries)
    fetchCloudEntries(user.id)
      .then((data) => {
        if (cancelled) return
        setCloudEntries(cloudDataToEntries(data))
        if (localEntriesAtSignIn.length > 0) setPendingMigration(localEntriesAtSignIn)
      })
      .catch(() => {
        if (!cancelled) setSyncError('Could not load your synced cinema. Please refresh and try again.')
      })
    const unsubscribe = subscribeToCloudChanges(user.id, () => {
      fetchCloudEntries(user.id)
        .then((data) => {
          if (!cancelled) setCloudEntries(cloudDataToEntries(data))
        })
        .catch(() => {
          /* a missed realtime refresh isn't user-visible; the next mutation will resync */
        })
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, user?.id])

  function pushToCloud(entry: LibraryEntry) {
    if (!user) return
    upsertCloudEntry(user.id, toCloudData(entry))
      .then(() => setSyncError(null))
      .catch(() => setSyncError(SYNC_ERROR_MESSAGE))
  }

  function updateCloudEntry(key: string, updater: (entry: LibraryEntry) => LibraryEntry) {
    const entry = cloudEntriesSnapshot.current?.[key]
    if (!entry) return
    const updated = updater(entry)
    setCloudEntries({ ...cloudEntriesSnapshot.current, [key]: updated })
    pushToCloud(updated)
  }

  function addCloudEntry(media: MediaSummary, watchlisted: boolean, watched = false) {
    const key = mediaKey(media.mediaType, media.id)
    const current = cloudEntriesSnapshot.current ?? {}
    if (current[key]) return
    const base = buildEntryFromMedia(media, 0, watchlisted)
    const entry = watched ? { ...base, watched: true, watchedAt: new Date().toISOString() } : base
    setCloudEntries({ ...current, [key]: entry })
    pushToCloud(entry)
  }

  function removeCloudEntry(mediaType: MediaType, id: number) {
    const key = mediaKey(mediaType, id)
    if (!cloudEntriesSnapshot.current) return
    const { [key]: _removed, ...rest } = cloudEntriesSnapshot.current
    setCloudEntries(rest)
    if (user) {
      deleteCloudEntry(user.id, mediaType, id).catch(() => setSyncError(SYNC_ERROR_MESSAGE))
    }
  }

  const resolveMigration = useCallback(
    (sync: boolean) => {
      const localEntries = pendingMigration
      setPendingMigration(null)
      if (!sync || !localEntries || !user) return
      const base = cloudEntriesSnapshot.current ?? {}
      const merged: Record<string, LibraryEntry> = { ...base }
      for (const localEntry of localEntries) {
        const key = mediaKey(localEntry.mediaType, localEntry.tmdbId)
        merged[key] = mergeEntries(base[key], localEntry)
      }
      setCloudEntries(merged)
      setIsSyncing(true)
      const uid = user.id
      Promise.all(Object.values(merged).map((entry) => upsertCloudEntry(uid, toCloudData(entry))))
        .then(() => setSyncError(null))
        .catch(() => setSyncError(SYNC_ERROR_MESSAGE))
        .finally(() => setIsSyncing(false))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pendingMigration, cloudEntries, user],
  )

  const addToWatchlist = useCallback(
    (media: MediaSummary) => {
      if (status === 'signedIn') addCloudEntry(media, true)
      else localDispatch({ type: 'ADD', media })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, cloudEntries],
  )
  const addToLibrary = useCallback(
    (media: MediaSummary, options?: { watchlisted?: boolean }) => {
      if (status === 'signedIn') addCloudEntry(media, options?.watchlisted ?? false)
      else localDispatch({ type: 'ADD', media, watchlisted: options?.watchlisted ?? false })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, cloudEntries],
  )
  const removeFromLibrary = useCallback(
    (mediaType: MediaType, id: number) => {
      if (status === 'signedIn') removeCloudEntry(mediaType, id)
      else localDispatch({ type: 'REMOVE', key: mediaKey(mediaType, id) })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, cloudEntries],
  )
  const setWatched = useCallback(
    (mediaType: MediaType, id: number, watched: boolean) => {
      const key = mediaKey(mediaType, id)
      if (status === 'signedIn') {
        updateCloudEntry(key, (e) => ({
          ...e,
          watched,
          watchedAt: watched ? (e.watchedAt ?? new Date().toISOString()) : e.watchedAt,
        }))
      } else {
        localDispatch({ type: 'SET_WATCHED', key, watched })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, cloudEntries],
  )
  const setWatchlisted = useCallback(
    (mediaType: MediaType, id: number, watchlisted: boolean) => {
      const key = mediaKey(mediaType, id)
      if (status === 'signedIn') updateCloudEntry(key, (e) => ({ ...e, watchlisted }))
      else localDispatch({ type: 'SET_WATCHLISTED', key, watchlisted })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, cloudEntries],
  )
  const setRating = useCallback(
    (mediaType: MediaType, id: number, rating: number | null) => {
      const key = mediaKey(mediaType, id)
      if (status === 'signedIn') updateCloudEntry(key, (e) => ({ ...e, rating }))
      else localDispatch({ type: 'SET_RATING', key, rating })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, cloudEntries],
  )
  const setNote = useCallback(
    (mediaType: MediaType, id: number, note: string) => {
      const key = mediaKey(mediaType, id)
      if (status === 'signedIn') updateCloudEntry(key, (e) => ({ ...e, note }))
      else localDispatch({ type: 'SET_NOTE', key, note })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, cloudEntries],
  )
  const toggleFavorite = useCallback(
    (mediaType: MediaType, id: number) => {
      const key = mediaKey(mediaType, id)
      if (status === 'signedIn') updateCloudEntry(key, (e) => ({ ...e, favorite: !e.favorite }))
      else localDispatch({ type: 'TOGGLE_FAVORITE', key })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, cloudEntries],
  )
  const resolveReviewItem = useCallback(
    (index: number, media: MediaSummary | null) => {
      const target = state.reviewItems[index]
      localDispatch({ type: 'RESOLVE_REVIEW', index, media: status === 'signedIn' ? null : media })
      if (media && status === 'signedIn') {
        addCloudEntry(media, true, target?.watched ?? false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.reviewItems, status, cloudEntries],
  )

  const activeEntries = status === 'signedIn' ? (cloudEntries ?? EMPTY_ENTRIES) : state.entries
  const entries = useMemo(() => Object.values(activeEntries), [activeEntries])
  const isInLibrary = useCallback(
    (mediaType: MediaType, id: number) => Boolean(activeEntries[mediaKey(mediaType, id)]),
    [activeEntries],
  )
  const getEntry = useCallback(
    (mediaType: MediaType, id: number) => activeEntries[mediaKey(mediaType, id)],
    [activeEntries],
  )

  const value: LibraryContextValue = {
    entries,
    entryMap: activeEntries,
    reviewItems: state.reviewItems,
    addToWatchlist,
    addToLibrary,
    removeFromLibrary,
    setWatched,
    setWatchlisted,
    setRating,
    setNote,
    toggleFavorite,
    resolveReviewItem,
    isInLibrary,
    getEntry,
    isCloudSynced,
    syncError,
    isSyncing,
    pendingMigration,
    resolveMigration,
  }

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider')
  return ctx
}
