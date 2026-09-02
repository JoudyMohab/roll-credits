import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { searchAll, TmdbError, hasTmdbKey } from '@/api/tmdb'
import type { MediaSummary } from '@/types/media'
import { pickRandom } from '@/lib/random'
import { useLibrary } from '@/lib/libraryStore'
import { SearchBar } from '@/components/SearchBar'
import { MediaTicket } from '@/components/MediaTicket'
import { TicketGrid, TicketGridItem } from '@/components/TicketGrid'
import { EmptyState } from '@/components/EmptyState'
import { Modal } from '@/components/Modal'
import { Seo } from '@/components/Seo'
import { Breadcrumbs } from '@/components/Breadcrumbs'

const SHUFFLE_DELAYS = [70, 85, 105, 130, 165, 215, 280, 360]

export default function Search() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { addToWatchlist, isInLibrary } = useLibrary()

  const initialQuery = params.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<MediaSummary[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [rollOpen, setRollOpen] = useState(false)
  const [phase, setPhase] = useState<'shuffling' | 'revealed'>('shuffling')
  const [shufflePick, setShufflePick] = useState<MediaSummary | null>(null)
  const [shuffleTick, setShuffleTick] = useState(0)
  const timeouts = useRef<number[]>([])

  useEffect(() => {
    const trimmed = query.trim()
    setParams(trimmed ? { q: trimmed } : {}, { replace: true })
    if (!trimmed) {
      setResults(null)
      setError(null)
      return
    }
    if (!hasTmdbKey()) {
      setError('No TMDB API key configured yet — search will work once VITE_TMDB_API_KEY is set.')
      return
    }
    setLoading(true)
    setError(null)
    const handle = window.setTimeout(() => {
      searchAll(trimmed)
        .then((r) => setResults([...r.movies, ...r.tv].sort((a, b) => b.popularity - a.popularity)))
        .catch((err: unknown) => setError(err instanceof TmdbError ? err.message : 'Something went wrong searching TMDB.'))
        .finally(() => setLoading(false))
    }, 350)
    return () => window.clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const clearTimers = useCallback(() => {
    timeouts.current.forEach((t) => window.clearTimeout(t))
    timeouts.current = []
  }, [])
  useEffect(() => clearTimers, [clearTimers])

  function runRoll() {
    if (!results || results.length === 0) return
    clearTimers()
    setRollOpen(true)
    setPhase('shuffling')
    const picked = pickRandom(results)!
    let elapsed = 0
    SHUFFLE_DELAYS.forEach((delay, i) => {
      elapsed += delay
      const isLast = i === SHUFFLE_DELAYS.length - 1
      const t = window.setTimeout(() => {
        setShufflePick(isLast ? picked : pickRandom(results))
        setShuffleTick((n) => n + 1)
        if (isLast) setPhase('revealed')
      }, elapsed)
      timeouts.current.push(t)
    })
  }

  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <Seo
        title="Search"
        description="Search TMDB for any movie or show and add it straight to your cinema on Roll Credits."
        path="/search"
      />
      <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'Search' }]} />
      <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">WHAT ARE WE SCREENING?</h1>
      <div className="mt-5 max-w-lg">
        <SearchBar value={query} onChange={setQuery} large autoFocus placeholder="Search for a movie or show…" />
      </div>

      <div className="mt-8">
        {!query.trim() && (
          <p className="font-sans text-sm text-ink/50">Search by title — the box office is open.</p>
        )}

        {loading && <p className="font-mono text-xs uppercase tracking-wide text-ink/50">Checking the listings…</p>}

        {error && (
          <p className="rounded-sm border border-burgundy/30 bg-burgundy/5 px-4 py-3 font-sans text-sm text-burgundy">
            {error}
          </p>
        )}

        {!loading && !error && results && results.length === 0 && (
          <EmptyState title="NOT PLAYING TONIGHT." subtitle="We couldn't find anything matching that." icon="🎬" />
        )}

        {!loading && results && results.length > 0 && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="font-mono text-xs font-bold uppercase tracking-wide text-ink/40">
                {results.length} result{results.length === 1 ? '' : 's'}
              </p>
              <button
                type="button"
                onClick={runRoll}
                className="rounded-sm bg-cherry px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-paper transition-transform hover:scale-105"
              >
                🎲 Roll The Credits
              </button>
            </div>
            <TicketGrid>
              {results.map((media, i) => {
                const added = isInLibrary(media.mediaType, media.id)
                return (
                  <TicketGridItem key={`${media.mediaType}-${media.id}`} index={i}>
                    <MediaTicket
                      mediaType={media.mediaType}
                      id={media.id}
                      fallback={{
                        title: media.title,
                        year: (media.mediaType === 'movie' ? media.releaseDate : media.firstAirDate)?.slice(0, 4)
                          ? Number((media.mediaType === 'movie' ? media.releaseDate : media.firstAirDate)!.slice(0, 4))
                          : null,
                        genreIds: media.genreIds,
                        voteAverage: media.voteAverage,
                        overview: media.overview,
                      }}
                      variant="search"
                      onOpen={() => navigate(`/title/${media.mediaType}/${media.id}`)}
                      onQuickAction={added ? undefined : () => addToWatchlist(media)}
                      quickActionLabel={added ? undefined : '🎟️ Book Your Screening'}
                    />
                  </TicketGridItem>
                )
              })}
            </TicketGrid>
          </>
        )}
      </div>

      <Modal open={rollOpen} onClose={() => { clearTimers(); setRollOpen(false) }} label="Roll the credits" maxWidth="max-w-lg">
        <div className="flex flex-col items-center gap-6 px-8 py-12 text-center">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-cherry">
            {phase === 'shuffling' ? 'Rolling the reel…' : "Tonight's Screening"}
          </p>
          <div className="relative flex h-[300px] w-full items-center justify-center">
            <AnimatePresence mode="wait">
              {shufflePick && (
                <motion.div
                  key={phase === 'revealed' ? 'final' : `${shufflePick.id}-${shufflePick.mediaType}-${shuffleTick}`}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: phase === 'revealed' ? 0.4 : 0.09 }}
                >
                  <MediaTicket
                    mediaType={shufflePick.mediaType}
                    id={shufflePick.id}
                    fallback={{
                      title: shufflePick.title,
                      year: null,
                      genreIds: shufflePick.genreIds,
                      voteAverage: shufflePick.voteAverage,
                      overview: shufflePick.overview,
                    }}
                    variant="search"
                    onOpen={() => {}}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {phase === 'revealed' && shufflePick && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  addToWatchlist(shufflePick)
                  setRollOpen(false)
                  navigate(`/title/${shufflePick.mediaType}/${shufflePick.id}`)
                }}
                className="rounded-sm bg-cherry px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wide text-paper transition-transform hover:scale-105"
              >
                I'm Watching It
              </button>
              <button
                type="button"
                onClick={runRoll}
                className="rounded-sm border border-ink/25 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wide text-ink/70 transition-colors hover:border-cherry hover:text-cherry"
              >
                Roll Again
              </button>
            </div>
          )}
        </div>
      </Modal>
    </section>
  )
}
