import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import type { MediaDetails, MediaSummary, MediaType } from '@/types/media'
import { isMovie } from '@/types/media'
import { useMediaDetailsCache } from '@/lib/detailsStore'
import { useLibrary } from '@/lib/libraryStore'
import { backdropUrl, hasTmdbKey, posterUrl, profileUrl } from '@/api/tmdb'
import { formatGenres, formatRuntime, formatSeasonsEpisodes, formatTicketDate, formatYearRange, truncate } from '@/lib/format'
import { RatingInput } from '@/components/RatingInput'
import { StampScreeningModal } from '@/components/StampScreeningModal'
import { WatchAvailability } from '@/components/WatchAvailability'

export default function MediaDetailPage() {
  const { mediaType, id } = useParams<{ mediaType: string; id: string }>()
  const numericId = Number(id)
  const validType: MediaType | null = mediaType === 'movie' || mediaType === 'tv' ? mediaType : null

  if (!validType || !Number.isFinite(numericId)) return <Navigate to="/" replace />

  return <DetailBody mediaType={validType} id={numericId} />
}

function DetailBody({ mediaType, id }: { mediaType: MediaType; id: number }) {
  const { data: details, loading, error } = useMediaDetailsCache(mediaType, id)

  if (!hasTmdbKey()) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-16 text-center">
        <p className="font-display text-2xl text-ink">No TMDB API key configured.</p>
        <p className="mt-2 font-sans text-sm text-ink/55">Set VITE_TMDB_API_KEY in your .env file to load details.</p>
        <Link to="/" className="mt-6 inline-block font-mono text-xs uppercase tracking-wide text-cherry">
          ← Back home
        </Link>
      </section>
    )
  }

  if (error) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-16 text-center">
        <p className="font-display text-2xl text-ink">NOT PLAYING TONIGHT.</p>
        <p className="mt-2 font-sans text-sm text-ink/55">{error}</p>
        <Link to="/" className="mt-6 inline-block font-mono text-xs uppercase tracking-wide text-cherry">
          ← Back home
        </Link>
      </section>
    )
  }

  if (loading || !details) {
    return (
      <section className="mx-auto max-w-4xl px-5 py-16">
        <div className="h-64 w-full animate-pulse rounded-md bg-paper-secondary" />
        <div className="mt-6 h-8 w-1/2 animate-pulse rounded bg-paper-secondary" />
        <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-paper-secondary" />
      </section>
    )
  }

  return <DetailContent mediaType={mediaType} id={id} details={details} />
}

function DetailContent({ mediaType, id, details }: { mediaType: MediaType; id: number; details: MediaDetails }) {
  const { getEntry, addToWatchlist, removeFromLibrary, setWatched, setWatchlisted, setRating, setNote, toggleFavorite } =
    useLibrary()
  const entry = getEntry(mediaType, id)
  const [stampOpen, setStampOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState(entry?.note ?? '')
  const [editingNote, setEditingNote] = useState(false)

  const backdrop = backdropUrl(details.backdropPath)
  const poster = posterUrl(details.posterPath, 'w342')
  const byline = isMovie(details) ? details.director : details.creators.join(', ')
  const bylineLabel = isMovie(details) ? 'Directed by' : 'Created by'
  const secondLine = isMovie(details)
    ? formatRuntime(details.runtime)
    : formatSeasonsEpisodes(details.numberOfSeasons, details.numberOfEpisodes)

  function toSummary(): MediaSummary {
    const base = {
      id,
      mediaType,
      title: details.title,
      overview: details.overview,
      posterPath: details.posterPath,
      backdropPath: details.backdropPath,
      genres: details.genres,
      genreIds: details.genreIds,
      voteAverage: details.voteAverage,
      popularity: details.popularity,
    }
    return isMovie(details)
      ? { ...base, mediaType: 'movie', releaseDate: details.releaseDate }
      : { ...base, mediaType: 'tv', firstAirDate: details.firstAirDate, lastAirDate: details.lastAirDate }
  }

  function handleStampSubmit(rating: number | null, note: string) {
    setWatched(mediaType, id, true)
    if (rating) setRating(mediaType, id, rating)
    if (note) setNote(mediaType, id, note)
    setStampOpen(false)
  }

  return (
    <article>
      <div className="relative h-[36vh] min-h-[220px] w-full overflow-hidden bg-black">
        {backdrop ? (
          <img src={backdrop} alt="" className="h-full w-full object-cover opacity-55" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-cherry/30 to-black" />
        )}
        {/* Photos are unpredictably bright — a flat scrim keeps the hero moody in both themes */}
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-paper from-55% to-transparent" />
        <Link
          to="/"
          className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-paper/40 bg-ink/40 font-sans text-paper backdrop-blur-sm hover:bg-ink/60"
          aria-label="Back"
        >
          ←
        </Link>
      </div>

      <div className="mx-auto -mt-14 max-w-4xl px-5 pb-20">
        <div className="rounded-lg border border-ink/15 bg-paper paper-texture p-6 shadow-[var(--shadow-ticket-hover)] sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row">
            {poster && (
              <img
                src={poster}
                alt=""
                className="h-52 w-36 shrink-0 self-center rounded-sm border border-ink/10 object-cover shadow-md sm:self-start"
              />
            )}
            <div className="flex-1">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cherry">
                {mediaType === 'movie' ? '🎬 Admit One' : '📺 Series Pass'}
              </p>
              <h1 className="mt-1 font-display text-3xl font-bold text-ink sm:text-4xl">{details.title}</h1>
              <p className="mt-2 font-sans text-sm font-semibold uppercase tracking-wide text-ink/60">
                {formatYearRange(details)}
                {details.genres.length ? ` · ${formatGenres(details.genres.map((g) => g.name), 4)}` : ''}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-ink/50">
                {secondLine && <span>{secondLine}</span>}
                {details.voteAverage > 0 && <span>★ {details.voteAverage.toFixed(1)} TMDB</span>}
                <span className="uppercase">{details.status}</span>
              </div>
              {byline && (
                <p className="mt-3 font-sans text-sm italic text-ink/70">
                  {bylineLabel} {byline}
                </p>
              )}
              <p className="mt-4 font-sans text-sm leading-relaxed text-ink/80">{details.overview || 'No synopsis available.'}</p>
              <div className="mt-5">
                <WatchAvailability mediaType={mediaType} id={id} />
              </div>
            </div>
          </div>

          {details.cast.length > 0 && (
            <div className="mt-8">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink/40">Cast</p>
              <div className="scrollbar-none mt-3 flex gap-4 overflow-x-auto pb-2">
                {details.cast.map((c) => {
                  const photo = profileUrl(c.profilePath)
                  return (
                    <div key={c.id} className="flex w-20 shrink-0 flex-col items-center text-center">
                      <div className="h-20 w-20 overflow-hidden rounded-full border border-ink/15 bg-paper-secondary">
                        {photo && <img src={photo} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <p className="mt-1.5 font-sans text-[11px] font-semibold leading-tight text-ink">{c.name}</p>
                      <p className="font-sans text-[10px] leading-tight text-ink/50">{truncate(c.character, 40)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="my-8 border-t border-dashed border-ink/20" />

          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              {!entry ? (
                <button
                  type="button"
                  onClick={() => addToWatchlist(toSummary())}
                  className="rounded-sm bg-cherry px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wide text-paper transition-transform hover:scale-105"
                >
                  🎟️ Book Your Screening
                </button>
              ) : (
                <>
                  {!entry.watched && !entry.upcoming && (
                    <button
                      type="button"
                      onClick={() => setStampOpen(true)}
                      className="rounded-sm bg-cherry px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wide text-paper transition-transform hover:scale-105"
                    >
                      Mark Watched
                    </button>
                  )}
                  {entry.watched && (
                    <button
                      type="button"
                      onClick={() => setStampOpen(true)}
                      className="rounded-sm border border-ink/25 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wide text-ink/70 hover:border-cherry hover:text-cherry"
                    >
                      Edit Rating
                    </button>
                  )}
                  {entry.watched && (
                    <button
                      type="button"
                      onClick={() => {
                        setWatched(mediaType, id, false)
                        setWatchlisted(mediaType, id, true)
                      }}
                      className="font-mono text-[11px] uppercase tracking-wide text-ink/40 hover:text-ink/70"
                    >
                      Move back to watchlist
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleFavorite(mediaType, id)}
                    aria-pressed={entry.favorite}
                    className={`font-mono text-[11px] uppercase tracking-wide transition-colors ${
                      entry.favorite ? 'text-gold' : 'text-ink/40 hover:text-gold'
                    }`}
                  >
                    {entry.favorite ? '★ Favorited' : '☆ Add to favorites'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromLibrary(mediaType, id)}
                    className="font-mono text-[11px] uppercase tracking-wide text-ink/40 hover:text-burgundy"
                  >
                    Remove from cinema
                  </button>
                </>
              )}
            </div>

            {entry && (
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink/40">Ticket Status</p>
                  <p className="mt-1 font-sans text-sm text-ink/80">
                    {entry.upcoming
                      ? 'Not yet released'
                      : entry.watched
                        ? `✓ Admitted · Screened ${formatTicketDate(entry.watchedAt)}`
                        : 'Waiting for screening'}
                  </p>
                  <p className="mt-3 font-mono text-[10px] font-bold uppercase tracking-wide text-ink/40">Serial</p>
                  <p className="mt-1 font-mono text-xs text-ink/60">{entry.ticket.serial}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink/40">Your Rating</p>
                  <div className="mt-1">
                    <RatingInput value={entry.rating} onChange={(r) => setRating(mediaType, id, r)} />
                  </div>
                </div>
              </div>
            )}

            {entry && (
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink/40">Your Note</p>
                {editingNote ? (
                  <div className="mt-2 flex flex-col gap-2">
                    <textarea
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-sm border border-ink/20 bg-paper px-3 py-2 font-sans text-sm text-ink focus-visible:border-cherry"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setNote(mediaType, id, noteDraft)
                          setEditingNote(false)
                        }}
                        className="rounded-sm bg-cherry px-4 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wide text-paper"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNoteDraft(entry.note)
                          setEditingNote(false)
                        }}
                        className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink/50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingNote(true)}
                    className="mt-1 block w-full rounded-sm border border-dashed border-ink/20 px-3 py-2 text-left font-sans text-sm italic text-ink/60 hover:border-ink/40"
                  >
                    {entry.note || 'Want to leave a note?'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {entry && (
        <StampScreeningModal
          open={stampOpen}
          onClose={() => setStampOpen(false)}
          title={entry.cache.title}
          initialRating={entry.rating}
          initialNote={entry.note}
          onSubmit={handleStampSubmit}
        />
      )}
    </article>
  )
}
