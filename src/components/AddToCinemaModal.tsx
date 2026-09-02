import { useEffect, useState } from 'react'
import { searchAll, TmdbError, hasTmdbKey } from '@/api/tmdb'
import type { MediaSummary, MediaType } from '@/types/media'
import { useLibrary } from '@/lib/libraryStore'
import { Modal } from './Modal'
import { SearchBar } from './SearchBar'
import { MediaTicket } from './MediaTicket'
import { TicketGrid, TicketGridItem } from './TicketGrid'
import { EmptyState } from './EmptyState'

interface Banner {
  type: 'added' | 'exists'
  title: string
  mediaType: MediaType
  id: number
}

export function AddToCinemaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addToLibrary, setWatchlisted, isInLibrary, getEntry } = useLibrary()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MediaSummary[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [banner, setBanner] = useState<Banner | null>(null)

  useEffect(() => {
    const trimmed = query.trim()
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
        .catch((err: unknown) =>
          setError(err instanceof TmdbError ? err.message : "We couldn't search right now. Please try again."),
        )
        .finally(() => setLoading(false))
    }, 350)
    return () => window.clearTimeout(handle)
  }, [query])

  function handleSelect(media: MediaSummary) {
    const already = isInLibrary(media.mediaType, media.id)
    if (!already) {
      addToLibrary(media)
    }
    setBanner({ type: already ? 'exists' : 'added', title: media.title, mediaType: media.mediaType, id: media.id })
  }

  const bannerEntry = banner ? getEntry(banner.mediaType, banner.id) : undefined

  return (
    <Modal open={open} onClose={onClose} label="Add to your cinema" maxWidth="max-w-2xl">
      <div className="px-6 py-8 sm:px-8">
        <h2 className="font-display text-2xl font-semibold text-ink">Add To Your Cinema</h2>
        <p className="mt-1 font-sans text-sm text-ink/55">Find a movie or show to add to your collection.</p>

        <div className="mt-5">
          <label
            htmlFor="add-to-cinema-search"
            className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink/40"
          >
            What Are We Screening?
          </label>
          <div className="mt-2">
            <SearchBar
              id="add-to-cinema-search"
              value={query}
              onChange={setQuery}
              placeholder="Search movies, shows, actors..."
              autoFocus
            />
          </div>
        </div>

        {banner && (
          <div className="mt-5 flex items-start justify-between gap-3 rounded-sm border border-cherry/30 bg-cherry/5 px-4 py-3">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-cherry">
                {banner.type === 'added' ? 'Ticket Added' : 'Already In Your Cinema'}
              </p>
              <p className="mt-0.5 font-sans text-sm text-ink/70">
                {banner.type === 'added'
                  ? `${banner.title} is now waiting for its screening.`
                  : `${banner.title} is already part of your collection.`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {bannerEntry && !bannerEntry.watchlisted && (
                <button
                  type="button"
                  onClick={() => setWatchlisted(banner.mediaType, banner.id, true)}
                  className="font-mono text-[10px] font-bold uppercase tracking-wide text-cherry hover:underline"
                >
                  + Add To Watchlist
                </button>
              )}
              <button
                type="button"
                onClick={() => setBanner(null)}
                aria-label="Dismiss"
                className="font-sans text-ink/40 hover:text-ink/70"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="mt-6">
          {!query.trim() && (
            <EmptyState
              title="WHAT ARE WE SCREENING?"
              subtitle="Search for a movie or show to add it to your cinema."
              icon="🎬"
            />
          )}

          {loading && <p className="font-mono text-xs uppercase tracking-wide text-ink/50">Checking the listings…</p>}

          {!loading && error && (
            <EmptyState title="THE PROJECTOR IS HAVING TROUBLE." subtitle={error} icon="🎞️" />
          )}

          {!loading && !error && query.trim() && results && results.length === 0 && (
            <EmptyState title="NOT PLAYING TONIGHT." subtitle="We couldn't find anything matching that." icon="🎬" />
          )}

          {!loading && !error && results && results.length > 0 && (
            <TicketGrid>
              {results.map((media, i) => {
                const already = isInLibrary(media.mediaType, media.id)
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
                      onOpen={() => handleSelect(media)}
                      onQuickAction={() => handleSelect(media)}
                      quickActionLabel={already ? '✓ Already In Your Cinema' : '+ Add To Cinema'}
                    />
                  </TicketGridItem>
                )
              })}
            </TicketGrid>
          )}
        </div>
      </div>
    </Modal>
  )
}
