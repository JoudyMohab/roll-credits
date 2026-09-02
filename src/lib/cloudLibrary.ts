import { supabase } from './supabaseClient'
import type { LibraryEntry } from '@/types/library'
import type { MediaType } from '@/types/media'

const TABLE = 'library_entries'

export interface CloudEntryData {
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
  cache: LibraryEntry['cache']
}

interface Row {
  tmdb_id: number
  media_type: MediaType
  watchlisted: boolean
  watched: boolean
  watched_at: string | null
  rating: number | null
  note: string
  favorite: boolean
  upcoming: boolean
  cache_title: string
  cache_poster_path: string | null
  cache_year: number | null
  cache_genre_ids: number[] | null
  cache_vote_average: number | string | null
  added_at: string
}

function rowToEntryData(row: Row): CloudEntryData {
  return {
    tmdbId: row.tmdb_id,
    mediaType: row.media_type,
    addedAt: row.added_at,
    watchlisted: row.watchlisted,
    watched: row.watched,
    watchedAt: row.watched_at,
    rating: row.rating,
    note: row.note,
    favorite: row.favorite,
    upcoming: row.upcoming,
    cache: {
      title: row.cache_title,
      posterPath: row.cache_poster_path,
      year: row.cache_year,
      genreIds: row.cache_genre_ids ?? [],
      voteAverage: row.cache_vote_average != null ? Number(row.cache_vote_average) : 0,
    },
  }
}

function entryDataToRow(userId: string, entry: CloudEntryData) {
  return {
    user_id: userId,
    tmdb_id: entry.tmdbId,
    media_type: entry.mediaType,
    watchlisted: entry.watchlisted,
    watched: entry.watched,
    watched_at: entry.watchedAt,
    rating: entry.rating,
    note: entry.note,
    favorite: entry.favorite,
    upcoming: entry.upcoming,
    cache_title: entry.cache.title,
    cache_poster_path: entry.cache.posterPath,
    cache_year: entry.cache.year,
    cache_genre_ids: entry.cache.genreIds,
    cache_vote_average: entry.cache.voteAverage,
    added_at: entry.addedAt,
  }
}

export async function fetchCloudEntries(userId: string): Promise<CloudEntryData[]> {
  if (!supabase) throw new Error('Accounts are not configured for this deployment.')
  const { data, error } = await supabase.from(TABLE).select('*').eq('user_id', userId)
  if (error) throw error
  return (data as Row[]).map(rowToEntryData)
}

export async function upsertCloudEntry(userId: string, entry: CloudEntryData): Promise<void> {
  if (!supabase) throw new Error('Accounts are not configured for this deployment.')
  const { error } = await supabase
    .from(TABLE)
    .upsert(entryDataToRow(userId, entry), { onConflict: 'user_id,tmdb_id,media_type' })
  if (error) throw error
}

export async function deleteCloudEntry(userId: string, mediaType: MediaType, tmdbId: number): Promise<void> {
  if (!supabase) throw new Error('Accounts are not configured for this deployment.')
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('media_type', mediaType)
    .eq('tmdb_id', tmdbId)
  if (error) throw error
}

/** Subscribes to Postgres changes on this user's rows so other devices' edits sync live. */
export function subscribeToCloudChanges(userId: string, onChange: () => void): () => void {
  const client = supabase
  if (!client) return () => {}
  const channel = client
    .channel(`library-entries-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE, filter: `user_id=eq.${userId}` },
      onChange,
    )
    .subscribe()
  return () => {
    client.removeChannel(channel)
  }
}
