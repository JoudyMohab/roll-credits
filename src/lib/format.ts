import type { MediaDetails } from '@/types/media'
import { isMovie } from '@/types/media'

export function formatRuntime(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}M`
  if (m === 0) return `${h}H`
  return `${h}H ${m}M`
}

export function formatYearRange(details: MediaDetails): string {
  if (isMovie(details)) {
    return details.releaseDate ? details.releaseDate.slice(0, 4) : 'TBA'
  }
  const start = details.firstAirDate ? details.firstAirDate.slice(0, 4) : 'TBA'
  const ended = details.status === 'Ended' || details.status === 'Canceled'
  const end = details.lastAirDate ? details.lastAirDate.slice(0, 4) : start
  if (!ended) return `${start}–PRESENT`
  if (end === start) return start
  return `${start}–${end}`
}

export function formatGenres(names: string[], max = 2): string {
  return names
    .slice(0, max)
    .map((n) => n.toUpperCase())
    .join(' · ')
}

export function formatSeasonsEpisodes(seasons: number, episodes: number): string {
  const s = `${seasons} SEASON${seasons === 1 ? '' : 'S'}`
  const e = `${episodes} EPISODE${episodes === 1 ? '' : 'S'}`
  return `${s} · ${e}`
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

export function formatTicketDate(iso: string | null): string {
  if (!iso) return 'DATE UNKNOWN'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'DATE UNKNOWN'
  return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')} ${d.getFullYear()}`
}

export function truncate(text: string, max = 120): string {
  if (text.length <= max) return text
  return `${text.slice(0, max).trimEnd()}…`
}
