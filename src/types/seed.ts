import type { MediaType } from './media'

export interface SeedResolvedItem {
  rawTitle: string
  rawTitles?: string[]
  declaredType: MediaType
  watched: boolean
  correctedTitle: string
  upcomingFlag: boolean
  status: 'resolved'
  mediaType: MediaType
  tmdbId: number
  title: string
  year: number | null
  genreIds: number[]
  upcoming: boolean
}

export interface SeedCandidate {
  mediaType: MediaType
  tmdbId: number
  title: string
  year: number | null
  posterPath: string | null
  score: number
}

export interface SeedReviewItem {
  rawTitle: string
  declaredType: MediaType
  watched: boolean
  correctedTitle: string
  upcomingFlag: boolean
  status: 'ambiguous' | 'unresolved'
  candidates: SeedCandidate[]
}
