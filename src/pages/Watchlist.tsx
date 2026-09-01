import { useMemo, useState } from 'react'
import { useLibrary } from '@/lib/libraryStore'
import type { LibraryEntry } from '@/types/library'
import { LibraryBrowser } from '@/components/LibraryBrowser'
import { StampScreeningModal } from '@/components/StampScreeningModal'

export default function Watchlist() {
  const { entries, setWatched, setRating, setNote } = useLibrary()
  const [stampEntry, setStampEntry] = useState<LibraryEntry | null>(null)

  const unwatched = useMemo(() => entries.filter((e) => e.watchlisted && !e.watched), [entries])

  function handleSubmit(rating: number | null, note: string) {
    if (!stampEntry) return
    setWatched(stampEntry.mediaType, stampEntry.tmdbId, true)
    if (rating) setRating(stampEntry.mediaType, stampEntry.tmdbId, rating)
    if (note) setNote(stampEntry.mediaType, stampEntry.tmdbId, note)
    setStampEntry(null)
  }

  return (
    <>
      <LibraryBrowser
        entries={unwatched}
        heading="WAITING FOR SCREENING"
        tagline="movies and shows i've been “meaning to watch” since 2019"
        emptyTitle="well, this is awkward."
        emptySubtitle="You don't have anything waiting. Search for something to book a screening."
        emptyIcon="🎟️"
        quickAction={(entry) =>
          entry.upcoming ? undefined : { label: 'Mark Watched', onClick: () => setStampEntry(entry) }
        }
      />
      <StampScreeningModal
        open={Boolean(stampEntry)}
        onClose={() => setStampEntry(null)}
        title={stampEntry?.cache.title ?? ''}
        initialRating={stampEntry?.rating ?? null}
        initialNote={stampEntry?.note ?? ''}
        onSubmit={handleSubmit}
      />
    </>
  )
}
