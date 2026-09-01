import type {
  CastMember,
  Genre,
  MediaType,
  MovieDetails,
  MovieSummary,
  TVDetails,
  TVSummary,
} from '@/types/media'

const API_BASE = 'https://api.themoviedb.org/3'
const API_KEY = import.meta.env.VITE_TMDB_API_KEY as string | undefined
const IMAGE_BASE = 'https://image.tmdb.org/t/p'

export class TmdbError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'TmdbError'
    this.status = status
  }
}

export function hasTmdbKey(): boolean {
  return Boolean(API_KEY)
}

export function posterUrl(
  path: string | null,
  size: 'w92' | 'w185' | 'w342' | 'w500' | 'original' = 'w342',
): string | null {
  if (!path) return null
  return `${IMAGE_BASE}/${size}${path}`
}

export function backdropUrl(
  path: string | null,
  size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280',
): string | null {
  if (!path) return null
  return `${IMAGE_BASE}/${size}${path}`
}

export function profileUrl(path: string | null, size: 'w45' | 'w185' = 'w185'): string | null {
  if (!path) return null
  return `${IMAGE_BASE}/${size}${path}`
}

async function tmdbFetch<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  if (!API_KEY) {
    throw new TmdbError('No TMDB API key configured. Set VITE_TMDB_API_KEY in your .env file.')
  }
  const url = new URL(`${API_BASE}${path}`)
  url.searchParams.set('api_key', API_KEY)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value))
  }
  let res: Response
  try {
    res = await fetch(url.toString())
  } catch {
    throw new TmdbError('Could not reach TMDB. Check your connection.')
  }
  if (!res.ok) {
    if (res.status === 401) {
      throw new TmdbError('TMDB rejected the API key. Double-check VITE_TMDB_API_KEY.', 401)
    }
    if (res.status === 404) {
      throw new TmdbError('Not found on TMDB.', 404)
    }
    throw new TmdbError(`TMDB request failed (${res.status}).`, res.status)
  }
  return res.json() as Promise<T>
}

let movieGenreCache: Genre[] | null = null
let tvGenreCache: Genre[] | null = null

export async function getMovieGenres(): Promise<Genre[]> {
  if (movieGenreCache) return movieGenreCache
  const data = await tmdbFetch<{ genres: Genre[] }>('/genre/movie/list')
  movieGenreCache = data.genres
  return data.genres
}

export async function getTvGenres(): Promise<Genre[]> {
  if (tvGenreCache) return tvGenreCache
  const data = await tmdbFetch<{ genres: Genre[] }>('/genre/tv/list')
  tvGenreCache = data.genres
  return data.genres
}

export async function getAllGenres(): Promise<Genre[]> {
  const [movieGenres, tvGenres] = await Promise.all([getMovieGenres(), getTvGenres()])
  const map = new Map<number, Genre>()
  for (const g of [...movieGenres, ...tvGenres]) map.set(g.id, g)
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

function genreNamesFromIds(ids: number[], genres: Genre[]): Genre[] {
  const map = new Map(genres.map((g) => [g.id, g]))
  return ids.map((id) => map.get(id)).filter((g): g is Genre => Boolean(g))
}

interface RawMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  genre_ids?: number[]
  genres?: Genre[]
  vote_average: number
  popularity: number
  release_date: string | null
}

interface RawTV {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  genre_ids?: number[]
  genres?: Genre[]
  vote_average: number
  popularity: number
  first_air_date: string | null
  last_air_date: string | null
}

async function toMovieSummary(raw: RawMovie): Promise<MovieSummary> {
  const allGenres = raw.genres ?? (raw.genre_ids ? genreNamesFromIds(raw.genre_ids, await getMovieGenres()) : [])
  return {
    id: raw.id,
    mediaType: 'movie',
    title: raw.title,
    overview: raw.overview,
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    genres: allGenres,
    genreIds: raw.genre_ids ?? allGenres.map((g) => g.id),
    voteAverage: raw.vote_average,
    popularity: raw.popularity,
    releaseDate: raw.release_date || null,
  }
}

async function toTvSummary(raw: RawTV): Promise<TVSummary> {
  const allGenres = raw.genres ?? (raw.genre_ids ? genreNamesFromIds(raw.genre_ids, await getTvGenres()) : [])
  return {
    id: raw.id,
    mediaType: 'tv',
    title: raw.name,
    overview: raw.overview,
    posterPath: raw.poster_path,
    backdropPath: raw.backdrop_path,
    genres: allGenres,
    genreIds: raw.genre_ids ?? allGenres.map((g) => g.id),
    voteAverage: raw.vote_average,
    popularity: raw.popularity,
    firstAirDate: raw.first_air_date || null,
    lastAirDate: raw.last_air_date || null,
  }
}

export async function searchMovies(query: string): Promise<MovieSummary[]> {
  const data = await tmdbFetch<{ results: RawMovie[] }>('/search/movie', { query, include_adult: 'false' })
  return Promise.all(data.results.map(toMovieSummary))
}

export async function searchTv(query: string): Promise<TVSummary[]> {
  const data = await tmdbFetch<{ results: RawTV[] }>('/search/tv', { query, include_adult: 'false' })
  return Promise.all(data.results.map(toTvSummary))
}

interface RawPerson {
  id: number
  name: string
  known_for_department: string
}

export async function searchPeopleCredits(query: string): Promise<{ movies: MovieSummary[]; tv: TVSummary[] }> {
  const data = await tmdbFetch<{ results: RawPerson[] }>('/search/person', { query, include_adult: 'false' })
  const top = data.results.slice(0, 3)
  const movies: MovieSummary[] = []
  const tv: TVSummary[] = []
  await Promise.all(
    top.map(async (person) => {
      try {
        const credits = await tmdbFetch<{ cast: RawMovie[]; crew: (RawMovie & { job?: string })[] }>(
          `/person/${person.id}/movie_credits`,
        )
        const relevant = [...credits.cast, ...credits.crew.filter((c) => c.job === 'Director')]
        const seen = new Set<number>()
        for (const raw of relevant) {
          if (seen.has(raw.id)) continue
          seen.add(raw.id)
          movies.push(await toMovieSummary(raw))
        }
      } catch {
        /* ignore person lookup failures */
      }
      try {
        const credits = await tmdbFetch<{ cast: RawTV[]; crew: (RawTV & { job?: string })[] }>(
          `/person/${person.id}/tv_credits`,
        )
        const relevant = [...credits.cast, ...credits.crew.filter((c) => c.job === 'Executive Producer')]
        const seen = new Set<number>()
        for (const raw of relevant) {
          if (seen.has(raw.id)) continue
          seen.add(raw.id)
          tv.push(await toTvSummary(raw))
        }
      } catch {
        /* ignore person lookup failures */
      }
    }),
  )
  return { movies, tv }
}

export interface SearchResults {
  movies: MovieSummary[]
  tv: TVSummary[]
}

export async function searchAll(query: string): Promise<SearchResults> {
  const trimmed = query.trim()
  if (!trimmed) return { movies: [], tv: [] }
  const [movies, tv, people] = await Promise.all([
    searchMovies(trimmed).catch(() => []),
    searchTv(trimmed).catch(() => []),
    searchPeopleCredits(trimmed).catch(() => ({ movies: [], tv: [] })),
  ])
  const movieMap = new Map<number, MovieSummary>()
  for (const m of [...movies, ...people.movies]) movieMap.set(m.id, m)
  const tvMap = new Map<number, TVSummary>()
  for (const t of [...tv, ...people.tv]) tvMap.set(t.id, t)
  return {
    movies: [...movieMap.values()].sort((a, b) => b.popularity - a.popularity),
    tv: [...tvMap.values()].sort((a, b) => b.popularity - a.popularity),
  }
}

interface RawCredits {
  cast: { id: number; name: string; character: string; profile_path: string | null; order: number }[]
  crew: { id: number; name: string; job: string }[]
}

function toCastMembers(credits: RawCredits, limit = 12): CastMember[] {
  return [...credits.cast]
    .sort((a, b) => a.order - b.order)
    .slice(0, limit)
    .map((c) => ({ id: c.id, name: c.name, character: c.character, profilePath: c.profile_path }))
}

export async function getMovieDetails(id: number): Promise<MovieDetails> {
  const raw = await tmdbFetch<
    RawMovie & { runtime: number | null; status: string; credits: RawCredits }
  >(`/movie/${id}`, { append_to_response: 'credits' })
  const summary = await toMovieSummary(raw)
  const director = raw.credits.crew.find((c) => c.job === 'Director')?.name ?? null
  return {
    ...summary,
    runtime: raw.runtime,
    director,
    cast: toCastMembers(raw.credits),
    status: raw.status,
  }
}

export async function getTvDetails(id: number): Promise<TVDetails> {
  const raw = await tmdbFetch<
    RawTV & {
      number_of_seasons: number
      number_of_episodes: number
      status: string
      created_by: { name: string }[]
      credits: RawCredits
    }
  >(`/tv/${id}`, { append_to_response: 'credits' })
  const summary = await toTvSummary(raw)
  return {
    ...summary,
    numberOfSeasons: raw.number_of_seasons,
    numberOfEpisodes: raw.number_of_episodes,
    creators: raw.created_by.map((c) => c.name),
    cast: toCastMembers(raw.credits),
    status: raw.status,
  }
}

export async function getMediaDetails(mediaType: MediaType, id: number): Promise<MovieDetails | TVDetails> {
  return mediaType === 'movie' ? getMovieDetails(id) : getTvDetails(id)
}

interface RawMovieSearchResponse {
  results: RawMovie[]
}
interface RawTvSearchResponse {
  results: RawTV[]
}

export async function findBestMovieMatch(title: string): Promise<MovieSummary[]> {
  const data = await tmdbFetch<RawMovieSearchResponse>('/search/movie', { query: title, include_adult: 'false' })
  return Promise.all(data.results.slice(0, 5).map(toMovieSummary))
}

export async function findBestTvMatch(title: string): Promise<TVSummary[]> {
  const data = await tmdbFetch<RawTvSearchResponse>('/search/tv', { query: title, include_adult: 'false' })
  return Promise.all(data.results.slice(0, 5).map(toTvSummary))
}

export interface WatchProvider {
  id: number
  name: string
  logoPath: string | null
}

export interface CountryWatchAvailability {
  link: string | null
  flatrate: WatchProvider[]
  rent: WatchProvider[]
  buy: WatchProvider[]
}

interface RawWatchProvider {
  provider_id: number
  provider_name: string
  logo_path: string | null
}

interface RawCountryProviders {
  link?: string
  flatrate?: RawWatchProvider[]
  rent?: RawWatchProvider[]
  buy?: RawWatchProvider[]
}

interface RawWatchProvidersResponse {
  results: Record<string, RawCountryProviders>
}

function toWatchProviders(list?: RawWatchProvider[]): WatchProvider[] {
  return (list ?? []).map((p) => ({ id: p.provider_id, name: p.provider_name, logoPath: p.logo_path }))
}

export function watchProviderLogoUrl(path: string | null, size: 'w45' | 'w92' = 'w45'): string | null {
  if (!path) return null
  return `${IMAGE_BASE}/${size}${path}`
}

/**
 * Country-specific "where to watch" data (subscription/rent/buy), sourced from TMDB's
 * watch-providers endpoint (backed by JustWatch). Returns null when the title has no
 * listed availability in that country — distinct from a thrown TmdbError, which means
 * the check itself failed and availability is unknown rather than confirmed absent.
 */
export async function getWatchAvailability(
  mediaType: MediaType,
  id: number,
  country = 'EG',
): Promise<CountryWatchAvailability | null> {
  const path = mediaType === 'movie' ? `/movie/${id}/watch/providers` : `/tv/${id}/watch/providers`
  const data = await tmdbFetch<RawWatchProvidersResponse>(path)
  const entry = data.results[country]
  if (!entry) return null
  return {
    link: entry.link ?? null,
    flatrate: toWatchProviders(entry.flatrate),
    rent: toWatchProviders(entry.rent),
    buy: toWatchProviders(entry.buy),
  }
}
