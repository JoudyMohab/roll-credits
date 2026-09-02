import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLibrary } from '@/lib/libraryStore'
import { useGenres } from '@/lib/genreStore'
import { RandomPicker } from '@/components/RandomPicker'
import { Stats } from '@/components/Stats'
import { TicketGrid, TicketGridItem } from '@/components/TicketGrid'
import { MediaTicket } from '@/components/MediaTicket'
import { EmptyState } from '@/components/EmptyState'
import { Seo } from '@/components/Seo'

export default function Home() {
  const { entries, reviewItems } = useLibrary()
  const genres = useGenres()
  const navigate = useNavigate()

  const unwatched = useMemo(() => entries.filter((e) => e.watchlisted && !e.watched && !e.upcoming), [entries])
  const watched = useMemo(() => entries.filter((e) => e.watched), [entries])
  const movieCount = useMemo(() => entries.filter((e) => e.mediaType === 'movie').length, [entries])
  const showCount = useMemo(() => entries.filter((e) => e.mediaType === 'tv').length, [entries])

  const avgRating = useMemo(() => {
    const rated = entries.filter((e) => e.rating)
    if (rated.length === 0) return '—'
    return (rated.reduce((sum, e) => sum + (e.rating ?? 0), 0) / rated.length).toFixed(1)
  }, [entries])

  const genresUsed = useMemo(() => {
    const set = new Set<number>()
    for (const e of entries) for (const g of e.cache.genreIds) set.add(g)
    return set.size
  }, [entries])

  const recentlyAdded = useMemo(
    () => [...entries].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 6),
    [entries],
  )
  const recentlyScreened = useMemo(
    () =>
      [...entries]
        .filter((e) => e.watched)
        .sort((a, b) => (b.watchedAt ?? '').localeCompare(a.watchedAt ?? ''))
        .slice(0, 6),
    [entries],
  )

  return (
    <div>
      <Seo
        title="Roll Credits"
        description="A personal cinema archive for movies and shows — track your watchlist, log ratings and notes, and let Roll Credits pick tonight's screening for you."
        path="/"
      />
      {reviewItems.length > 0 && (
        <Link
          to="/review"
          className="block bg-gold/20 px-5 py-2.5 text-center font-mono text-[11px] font-bold uppercase tracking-wide text-ink/70 hover:bg-gold/30"
        >
          🗂️ {reviewItems.length} imported title{reviewItems.length === 1 ? '' : 's'} need a quick look — review now →
        </Link>
      )}
      <section className="mx-auto max-w-6xl px-5 pt-14 pb-10 text-center sm:pt-20">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-ink/40">Roll Credits presents</p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
          TONIGHT, WE SCREEN.
        </h1>
        <p className="mt-2 font-sans text-base italic text-ink/55">things i swear i'll watch eventually.</p>
        <p className="mt-6 font-display text-xl text-cherry">
          {unwatched.length} title{unwatched.length === 1 ? '' : 's'} waiting for you.
        </p>

        <div className="mt-8 flex justify-center">
          <RandomPicker
            entries={entries}
            showModeControls
            showScopeControls
            heading="TONIGHT'S SCREENING"
            subheading="Can't decide? Let the cinema decide."
            triggerLabel="🎲 Roll The Credits"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8">
        <h2 className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Your Cinema</h2>
        <Stats
          items={[
            { label: 'Waiting', value: unwatched.length },
            { label: 'Screened', value: watched.length },
            { label: 'Avg. Rating', value: avgRating },
            { label: 'Genres', value: genresUsed || genres.length },
          ]}
        />
        <p className="mt-4 text-center font-sans text-sm text-ink/45">
          {movieCount} movie{movieCount === 1 ? '' : 's'} · {showCount} show{showCount === 1 ? '' : 's'}
        </p>
      </section>

      {entries.length === 0 ? (
        <section className="mx-auto max-w-6xl px-5 py-10">
          <EmptyState
            title="well, this is awkward."
            subtitle="Your cinema is empty. Search for something to book its first screening."
            icon="🎟️"
          />
        </section>
      ) : (
        <>
          <RecentRow
            title="RECENTLY ADDED"
            entries={recentlyAdded}
            onOpen={(mt, id) => navigate(`/title/${mt}/${id}`)}
          />
          {recentlyScreened.length > 0 && (
            <RecentRow
              title="RECENTLY SCREENED"
              entries={recentlyScreened}
              onOpen={(mt, id) => navigate(`/title/${mt}/${id}`)}
            />
          )}
        </>
      )}
    </div>
  )
}

function RecentRow({
  title,
  entries,
  onOpen,
}: {
  title: string
  entries: ReturnType<typeof useLibrary>['entries']
  onOpen: (mediaType: 'movie' | 'tv', id: number) => void
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-8">
      <h2 className="mb-5 font-mono text-xs font-bold uppercase tracking-[0.2em] text-ink/40">{title}</h2>
      <TicketGrid>
        {entries.map((entry, i) => (
          <TicketGridItem key={`${entry.mediaType}-${entry.tmdbId}`} index={i}>
            <MediaTicket
              mediaType={entry.mediaType}
              id={entry.tmdbId}
              fallback={{
                title: entry.cache.title,
                year: entry.cache.year,
                genreIds: entry.cache.genreIds,
                voteAverage: entry.cache.voteAverage,
              }}
              variant="library"
              onOpen={() => onOpen(entry.mediaType, entry.tmdbId)}
            />
          </TicketGridItem>
        ))}
      </TicketGrid>
    </section>
  )
}
