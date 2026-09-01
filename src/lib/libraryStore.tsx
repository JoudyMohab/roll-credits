import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { LibraryEntry } from '@/types/library'
import type { MediaSummary, MediaType } from '@/types/media'
import { isMovie, mediaKey } from '@/types/media'
import type { SeedReviewItem } from '@/types/seed'
import { loadJSON, saveJSON } from './storage'
import { makeTicketMeta } from './ticketMeta'
import seedResolved from '@/data/seed-resolved.json'
import seedReview from '@/data/seed-review.json'
import type { SeedResolvedItem } from '@/types/seed'

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
  | { type: 'ADD'; media: MediaSummary }
  | { type: 'REMOVE'; key: string }
  | { type: 'SET_WATCHED'; key: string; watched: boolean }
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

function buildEntryFromMedia(media: MediaSummary, screeningNumber: number): LibraryEntry {
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
    watchlisted: true,
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
        entries: { ...state.entries, [key]: buildEntryFromMedia(action.media, state.nextScreeningNumber) },
        nextScreeningNumber: state.nextScreeningNumber + 1,
      }
    }
    case 'REMOVE': {
      const { [action.key]: _removed, ...rest } = state.entries
      return { ...state, entries: rest }
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

interface LibraryContextValue {
  entries: LibraryEntry[]
  entryMap: Record<string, LibraryEntry>
  reviewItems: SeedReviewItem[]
  addToWatchlist: (media: MediaSummary) => void
  removeFromLibrary: (mediaType: MediaType, id: number) => void
  setWatched: (mediaType: MediaType, id: number, watched: boolean) => void
  setRating: (mediaType: MediaType, id: number, rating: number | null) => void
  setNote: (mediaType: MediaType, id: number, note: string) => void
  toggleFavorite: (mediaType: MediaType, id: number) => void
  resolveReviewItem: (index: number, media: MediaSummary | null) => void
  isInLibrary: (mediaType: MediaType, id: number) => boolean
  getEntry: (mediaType: MediaType, id: number) => LibraryEntry | undefined
}

const LibraryContext = createContext<LibraryContextValue | null>(null)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init)

  useEffect(() => {
    saveJSON('library', state)
  }, [state])

  const addToWatchlist = useCallback((media: MediaSummary) => dispatch({ type: 'ADD', media }), [])
  const removeFromLibrary = useCallback(
    (mediaType: MediaType, id: number) => dispatch({ type: 'REMOVE', key: mediaKey(mediaType, id) }),
    [],
  )
  const setWatched = useCallback(
    (mediaType: MediaType, id: number, watched: boolean) =>
      dispatch({ type: 'SET_WATCHED', key: mediaKey(mediaType, id), watched }),
    [],
  )
  const setRating = useCallback(
    (mediaType: MediaType, id: number, rating: number | null) =>
      dispatch({ type: 'SET_RATING', key: mediaKey(mediaType, id), rating }),
    [],
  )
  const setNote = useCallback(
    (mediaType: MediaType, id: number, note: string) =>
      dispatch({ type: 'SET_NOTE', key: mediaKey(mediaType, id), note }),
    [],
  )
  const toggleFavorite = useCallback(
    (mediaType: MediaType, id: number) => dispatch({ type: 'TOGGLE_FAVORITE', key: mediaKey(mediaType, id) }),
    [],
  )
  const resolveReviewItem = useCallback(
    (index: number, media: MediaSummary | null) => dispatch({ type: 'RESOLVE_REVIEW', index, media }),
    [],
  )

  const entries = useMemo(() => Object.values(state.entries), [state.entries])
  const isInLibrary = useCallback(
    (mediaType: MediaType, id: number) => Boolean(state.entries[mediaKey(mediaType, id)]),
    [state.entries],
  )
  const getEntry = useCallback(
    (mediaType: MediaType, id: number) => state.entries[mediaKey(mediaType, id)],
    [state.entries],
  )

  const value: LibraryContextValue = {
    entries,
    entryMap: state.entries,
    reviewItems: state.reviewItems,
    addToWatchlist,
    removeFromLibrary,
    setWatched,
    setRating,
    setNote,
    toggleFavorite,
    resolveReviewItem,
    isInLibrary,
    getEntry,
  }

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider')
  return ctx
}
