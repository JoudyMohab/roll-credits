import type { MediaType } from './media'

export interface TicketMeta {
  screeningNumber: number
  rotation: number
  tone: number
  serial: string
}

export interface LibraryEntry {
  tmdbId: number
  mediaType: MediaType
  addedAt: string
  watchlisted: boolean
  watched: boolean
  watchedAt: string | null
  rating: number | null
  note: string
  favorite: boolean
  upcoming: boolean
  cache: {
    title: string
    posterPath: string | null
    year: number | null
    genreIds: number[]
    voteAverage: number
  }
  ticket: TicketMeta
}

export type SortKey =
  | 'a-z'
  | 'z-a'
  | 'newest'
  | 'oldest'
  | 'tmdb-rating'
  | 'personal-rating'

export type PickerMode = 'unwatched' | 'everything' | 'favorites' | 'selection'

export type PickerScope = 'all' | MediaType
