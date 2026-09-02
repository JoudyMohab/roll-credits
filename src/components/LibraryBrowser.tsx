import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LibraryEntry, SortKey } from '@/types/library'
import { useGenres } from '@/lib/genreStore'
import { EmptyState } from './EmptyState'
import { GenreFilter } from './GenreFilter'
import { SortControl, sortEntries } from './SortControl'
import { TicketGrid, TicketGridItem } from './TicketGrid'
import { MediaTicket } from './MediaTicket'
import { RandomPicker } from './RandomPicker'

interface LibraryBrowserProps {
  entries: LibraryEntry[]
  heading: string
  tagline?: string
  emptyTitle: string
  emptySubtitle: string
  emptyIcon?: string
  emptyAction?: ReactNode
  headerAction?: ReactNode
  quickAction?: (entry: LibraryEntry) => { label: string; onClick: () => void } | undefined
  showGenreFilter?: boolean
  showRoll?: boolean
  rollHeading?: string
  rollSubheading?: string
  defaultSort?: SortKey
  /** 'contextual' defaults the picker to unwatched items within the current filter (with a mode toggle).
   *  'raw' rolls from exactly the filtered/sorted list shown, ignoring watched status (for Watched/Search pages). */
  rollMode?: 'contextual' | 'raw'
}

export function LibraryBrowser({
  entries,
  heading,
  tagline,
  emptyTitle,
  emptySubtitle,
  emptyIcon,
  emptyAction,
  headerAction,
  quickAction,
  showGenreFilter = true,
  showRoll = true,
  rollHeading = "CAN'T DECIDE?",
  rollSubheading = 'Let the cinema decide.',
  defaultSort = 'a-z',
  rollMode = 'contextual',
}: LibraryBrowserProps) {
  const navigate = useNavigate()
  const genres = useGenres()
  const [genreId, setGenreId] = useState<number | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>(defaultSort)

  const filtered = useMemo(
    () => (genreId === null ? entries : entries.filter((e) => e.cache.genreIds.includes(genreId))),
    [entries, genreId],
  )
  const sorted = useMemo(() => sortEntries(filtered, sortKey), [filtered, sortKey])

  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">{heading}</h1>
            {headerAction}
          </div>
          {tagline && <p className="mt-1 font-sans text-sm text-ink/55">{tagline}</p>}
        </div>
        {entries.length > 0 && showRoll && (
          <RandomPicker
            entries={rollMode === 'contextual' ? sorted : []}
            selectionPool={rollMode === 'raw' ? sorted : undefined}
            showModeControls={rollMode === 'contextual'}
            triggerLabel="🎲 Roll The Credits"
            heading={rollHeading}
            subheading={rollSubheading}
          />
        )}
      </div>

      {entries.length === 0 ? (
        <EmptyState title={emptyTitle} subtitle={emptySubtitle} icon={emptyIcon} action={emptyAction} />
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {showGenreFilter ? (
              <GenreFilter genres={genres} selected={genreId} onSelect={setGenreId} />
            ) : (
              <div />
            )}
            <SortControl value={sortKey} onChange={setSortKey} />
          </div>

          {sorted.length === 0 ? (
            <EmptyState title="NOT PLAYING TONIGHT." subtitle="Nothing in this genre yet." icon="🎭" />
          ) : (
            <TicketGrid>
              {sorted.map((entry, i) => {
                const action = quickAction?.(entry)
                return (
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
                      onOpen={() => navigate(`/title/${entry.mediaType}/${entry.tmdbId}`)}
                      onQuickAction={action?.onClick}
                      quickActionLabel={action?.label}
                    />
                  </TicketGridItem>
                )
              })}
            </TicketGrid>
          )}
        </>
      )}
    </section>
  )
}
