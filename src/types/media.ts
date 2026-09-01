export type MediaType = 'movie' | 'tv'

export interface Genre {
  id: number
  name: string
}

export interface CastMember {
  id: number
  name: string
  character: string
  profilePath: string | null
}

interface BaseMedia {
  id: number
  mediaType: MediaType
  title: string
  overview: string
  posterPath: string | null
  backdropPath: string | null
  genres: Genre[]
  genreIds: number[]
  voteAverage: number
  popularity: number
}

export interface MovieSummary extends BaseMedia {
  mediaType: 'movie'
  releaseDate: string | null
}

export interface TVSummary extends BaseMedia {
  mediaType: 'tv'
  firstAirDate: string | null
  lastAirDate: string | null
}

export type MediaSummary = MovieSummary | TVSummary

export interface MovieDetails extends MovieSummary {
  runtime: number | null
  director: string | null
  cast: CastMember[]
  status: string
}

export interface TVDetails extends TVSummary {
  numberOfSeasons: number
  numberOfEpisodes: number
  creators: string[]
  cast: CastMember[]
  status: string
}

export type MediaDetails = MovieDetails | TVDetails

export function isMovie(m: { mediaType: MediaType }): m is MovieSummary {
  return m.mediaType === 'movie'
}

export function isTV(m: { mediaType: MediaType }): m is TVSummary {
  return m.mediaType === 'tv'
}

export function mediaYear(m: MediaSummary | MediaDetails): number | null {
  const date = isMovie(m) ? m.releaseDate : m.firstAirDate
  if (!date) return null
  const year = Number(date.slice(0, 4))
  return Number.isFinite(year) ? year : null
}

export function mediaKey(mediaType: MediaType, id: number): string {
  return `${mediaType}-${id}`
}
