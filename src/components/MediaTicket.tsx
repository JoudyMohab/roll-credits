import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { MediaType } from '@/types/media'
import { isMovie, mediaKey } from '@/types/media'
import { useLibrary } from '@/lib/libraryStore'
import { useMediaDetailsCache } from '@/lib/detailsStore'
import { useGenres, genreNamesFromIds } from '@/lib/genreStore'
import { makeTicketMeta } from '@/lib/ticketMeta'
import { formatGenres, formatRuntime, formatSeasonsEpisodes, formatTicketDate, formatYearRange } from '@/lib/format'

export interface TicketFallback {
  title: string
  year: number | null
  genreIds: number[]
  voteAverage?: number
  overview?: string
}

interface MediaTicketProps {
  mediaType: MediaType
  id: number
  fallback: TicketFallback
  variant: 'search' | 'library'
  onOpen: () => void
  onQuickAction?: () => void
  quickActionLabel?: string
}

const TONE_BG = ['bg-paper', 'bg-paper-tone2', 'bg-paper-secondary']

export function MediaTicket({ mediaType, id, fallback, variant, onOpen, onQuickAction, quickActionLabel }: MediaTicketProps) {
  const { getEntry } = useLibrary()
  const entry = variant === 'library' ? getEntry(mediaType, id) : undefined
  const { data: details } = useMediaDetailsCache(mediaType, id)
  const genres = useGenres()

  const ticketMeta = useMemo(
    () => entry?.ticket ?? makeTicketMeta(mediaKey(mediaType, id), 0),
    [entry, mediaType, id],
  )

  const genreNames = details ? details.genres.map((g) => g.name) : genreNamesFromIds(fallback.genreIds, genres)
  const yearLabel = details ? formatYearRange(details) : (fallback.year ?? 'TBA')
  const rating = details?.voteAverage ?? fallback.voteAverage ?? 0
  const overview = details?.overview ?? fallback.overview ?? ''

  const secondLine = details
    ? isMovie(details)
      ? formatRuntime(details.runtime)
      : formatSeasonsEpisodes(details.numberOfSeasons, details.numberOfEpisodes)
    : null

  const byline = details ? (isMovie(details) ? details.director : details.creators.join(', ')) : null

  const isWatched = entry?.watched ?? false
  const isUpcoming = entry?.upcoming ?? false

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ rotate: ticketMeta.rotation }}
      whileHover={{ rotate: 0, y: -5, transition: { type: 'spring', stiffness: 350, damping: 20 } }}
      whileTap={{ scale: 0.98 }}
      whileFocus={{ rotate: 0 }}
      className={`group relative flex w-full max-w-[280px] flex-col rounded-md border ${isWatched ? 'border-ink/25' : 'border-ink/15'} ${TONE_BG[ticketMeta.tone]} paper-texture text-left shadow-[var(--shadow-ticket)] transition-shadow hover:shadow-[var(--shadow-ticket-hover)] focus-visible:shadow-[var(--shadow-ticket-hover)]`}
      aria-label={`${fallback.title}, ${yearLabel}. ${isWatched ? 'Watched' : 'Waiting to watch'}. Open details.`}
    >
      <div className="flex items-center justify-between border-b border-dashed border-ink/20 px-4 py-2.5">
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-cherry">Roll Credits</span>
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-ink/60">
          {mediaType === 'movie' ? '🎬 Admit One' : '📺 Series Pass'}
        </span>
      </div>

      <div className="flex flex-1 min-h-[128px] flex-col gap-2 px-4 pt-3.5 pb-2">
        <h3 className="font-display text-xl font-semibold leading-tight text-ink">{fallback.title}</h3>
        <div className="flex flex-col gap-1">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-wide text-ink/70">
            {yearLabel}
            {genreNames.length > 0 ? ` · ${formatGenres(genreNames)}` : ''}
          </p>
          {secondLine && <p className="font-mono text-[11px] text-burgundy/80">{secondLine}</p>}
          {byline && <p className="font-sans text-[11px] italic text-ink/60">{byline}</p>}
          {overview && <p className="line-clamp-2 font-sans text-[12px] leading-snug text-ink/60">{overview}</p>}
        </div>
      </div>

      <div className="relative flex items-center justify-between border-t border-dashed border-ink/25 px-4 py-2.5">
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper shadow-[inset_0_1px_2px_rgba(0,0,0,0.18)]"
        />
        <span
          aria-hidden
          className="absolute right-0 top-1/2 h-4 w-4 -translate-x-0 translate-x-1/2 -translate-y-1/2 rounded-full bg-paper shadow-[inset_0_1px_2px_rgba(0,0,0,0.18)]"
        />
        <span className="font-mono text-[10px] text-ink/50">
          {ticketMeta.screeningNumber > 0 ? `SCREENING #${String(ticketMeta.screeningNumber).padStart(4, '0')}` : ticketMeta.serial}
        </span>
        {rating > 0 && <span className="font-mono text-[10px] text-gold">★ {rating.toFixed(1)}</span>}
      </div>

      {variant === 'library' && (
        <div className="flex items-center justify-between border-t border-ink/10 px-4 py-2">
          {isUpcoming ? (
            <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-burgundy/70">
              Not Yet Released
            </span>
          ) : isWatched ? (
            <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-cherry">
              ✓ Admitted{entry?.watchedAt ? ` · Screened · ${formatTicketDate(entry.watchedAt)}` : ''}
            </span>
          ) : (
            <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink/50">
              Waiting For Screening
            </span>
          )}
          {entry?.rating ? (
            <span aria-label={`Rated ${entry.rating} of 5 stars`} className="font-mono text-xs text-cherry">
              {'★'.repeat(entry.rating)}
              <span className="text-ink/20">{'★'.repeat(5 - entry.rating)}</span>
            </span>
          ) : null}
        </div>
      )}

      {onQuickAction && quickActionLabel && (
        <div className="px-4 pb-3">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              onQuickAction()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                onQuickAction()
              }
            }}
            className="block w-full rounded-sm border border-cherry/40 bg-cherry/5 py-1.5 text-center font-mono text-[10px] font-bold uppercase tracking-wide text-cherry transition-colors hover:bg-cherry hover:text-paper"
          >
            {quickActionLabel}
          </span>
        </div>
      )}
    </motion.button>
  )
}
