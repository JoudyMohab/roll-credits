import { useState } from 'react'
import { useLibrary } from '@/lib/libraryStore'
import { getMediaDetails, posterUrl, searchAll, TmdbError } from '@/api/tmdb'
import type { MediaSummary, MediaType } from '@/types/media'
import { isMovie } from '@/types/media'
import { EmptyState } from '@/components/EmptyState'
import { SearchBar } from '@/components/SearchBar'

function summaryFromDetails(details: Awaited<ReturnType<typeof getMediaDetails>>): MediaSummary {
  const base = {
    id: details.id,
    mediaType: details.mediaType,
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

export default function ImportReview() {
  const { reviewItems, resolveReviewItem } = useLibrary()
  const [busyIndex, setBusyIndex] = useState<number | null>(null)
  const [manualQuery, setManualQuery] = useState<Record<number, string>>({})
  const [manualResults, setManualResults] = useState<Record<number, MediaSummary[]>>({})

  async function choose(index: number, mediaType: MediaType, id: number) {
    setBusyIndex(index)
    try {
      const details = await getMediaDetails(mediaType, id)
      resolveReviewItem(index, summaryFromDetails(details))
    } catch {
      /* leave the item in the review queue if TMDB lookup fails */
    } finally {
      setBusyIndex(null)
    }
  }

  function discard(index: number) {
    resolveReviewItem(index, null)
  }

  async function runManualSearch(index: number, query: string) {
    setManualQuery((m) => ({ ...m, [index]: query }))
    if (!query.trim()) {
      setManualResults((m) => ({ ...m, [index]: [] }))
      return
    }
    try {
      const { movies, tv } = await searchAll(query)
      setManualResults((m) => ({ ...m, [index]: [...movies, ...tv].slice(0, 6) }))
    } catch (err) {
      if (!(err instanceof TmdbError)) throw err
    }
  }

  if (reviewItems.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-16">
        <EmptyState
          title="nothing left to review."
          subtitle="Every imported title has been matched to something on TMDB."
          icon="🗂️"
        />
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-3xl font-bold text-ink">REVIEW IMPORTS</h1>
      <p className="mt-1 font-sans text-sm text-ink/55">
        {reviewItems.length} title{reviewItems.length === 1 ? '' : 's'} from your list couldn't be matched with
        confidence. Pick the right one, or discard it.
      </p>

      <div className="mt-8 flex flex-col gap-6">
        {reviewItems.map((item, index) => (
          <div key={`${item.rawTitle}-${index}`} className="rounded-md border border-ink/15 bg-paper-secondary/40 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-display text-lg font-semibold text-ink">"{item.rawTitle}"</p>
                <p className="font-mono text-[10px] uppercase tracking-wide text-ink/40">
                  declared as {item.declaredType} · {item.watched ? 'watched' : 'unwatched'} ·{' '}
                  {item.status === 'ambiguous' ? 'multiple possible matches' : 'no confident match found'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => discard(index)}
                className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink/40 hover:text-burgundy"
              >
                Discard
              </button>
            </div>

            {item.candidates.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {item.candidates.map((c) => (
                  <button
                    key={`${c.mediaType}-${c.tmdbId}`}
                    type="button"
                    disabled={busyIndex === index}
                    onClick={() => choose(index, c.mediaType, c.tmdbId)}
                    className="flex w-40 flex-col gap-1.5 rounded-sm border border-ink/15 bg-paper p-2 text-left transition-colors hover:border-cherry disabled:opacity-50"
                  >
                    {posterUrl(c.posterPath, 'w185') && (
                      <img src={posterUrl(c.posterPath, 'w185')!} alt="" className="h-40 w-full rounded-sm object-cover" />
                    )}
                    <span className="font-sans text-xs font-semibold text-ink">{c.title}</span>
                    <span className="font-mono text-[10px] text-ink/45">
                      {c.year ?? 'TBA'} · {c.mediaType === 'movie' ? '🎬' : '📺'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4">
              <SearchBar
                value={manualQuery[index] ?? ''}
                onChange={(v) => runManualSearch(index, v)}
                placeholder="Search manually to find the right match…"
              />
              {(manualResults[index]?.length ?? 0) > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {manualResults[index].map((m) => (
                    <button
                      key={`${m.mediaType}-${m.id}`}
                      type="button"
                      disabled={busyIndex === index}
                      onClick={() => choose(index, m.mediaType, m.id)}
                      className="flex w-40 flex-col gap-1.5 rounded-sm border border-ink/15 bg-paper p-2 text-left transition-colors hover:border-cherry disabled:opacity-50"
                    >
                      {posterUrl(m.posterPath, 'w185') && (
                        <img src={posterUrl(m.posterPath, 'w185')!} alt="" className="h-40 w-full rounded-sm object-cover" />
                      )}
                      <span className="font-sans text-xs font-semibold text-ink">{m.title}</span>
                      <span className="font-mono text-[10px] text-ink/45">{m.mediaType === 'movie' ? '🎬' : '📺'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
