import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLibrary } from '@/lib/libraryStore'
import { useGenres } from '@/lib/genreStore'
import { EmptyState } from '@/components/EmptyState'

const GENRE_TAGLINES: Record<string, string> = {
  Horror: 'waiting to scare you.',
  Comedy: 'waiting to make you laugh.',
  Romance: 'waiting to break your heart.',
  Action: 'waiting to get your pulse up.',
  Drama: 'waiting to make you cry.',
  Documentary: 'waiting to teach you something.',
  Animation: 'waiting to feel like a kid again.',
  Thriller: 'waiting to keep you up at night.',
  Mystery: 'waiting to be solved.',
  Fantasy: 'waiting to take you elsewhere.',
  'Science Fiction': 'waiting from the future.',
  Crime: 'waiting to break the law.',
}

export default function Browse() {
  const { entries } = useLibrary()
  const genres = useGenres()

  const counts = useMemo(() => {
    const map = new Map<number, number>()
    for (const e of entries) {
      if (e.watched || e.upcoming) continue
      for (const id of e.cache.genreIds) map.set(id, (map.get(id) ?? 0) + 1)
    }
    return map
  }, [entries])

  const populated = genres.filter((g) => (counts.get(g.id) ?? 0) > 0)

  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">🎭 BROWSE</h1>
      <p className="mt-1 font-sans text-sm text-ink/55">pick a mood, not a title.</p>

      {populated.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="nothing to browse yet."
            subtitle="Add a few movies or shows to your watchlist and genres will show up here."
            icon="🎭"
          />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {populated.map((g) => (
            <Link
              key={g.id}
              to={`/browse/${g.id}`}
              className="group rounded-md border border-ink/15 bg-paper-secondary/60 p-5 shadow-[var(--shadow-ticket)] transition-transform hover:-translate-y-1 hover:shadow-[var(--shadow-ticket-hover)]"
            >
              <p className="font-display text-xl font-bold uppercase text-cherry">{g.name}</p>
              <p className="mt-1 font-sans text-sm text-ink/60">
                {counts.get(g.id)} {counts.get(g.id) === 1 ? 'title' : 'titles'}{' '}
                {GENRE_TAGLINES[g.name] ?? 'waiting for you.'}
              </p>
              <p className="mt-3 font-mono text-[10px] font-bold uppercase tracking-wide text-ink/40 group-hover:text-cherry">
                🎲 Roll The Credits →
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
