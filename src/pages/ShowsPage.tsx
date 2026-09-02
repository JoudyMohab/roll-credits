import { useMemo } from 'react'
import { useLibrary } from '@/lib/libraryStore'
import { LibraryBrowser } from '@/components/LibraryBrowser'
import { AddToCinemaButton } from '@/components/AddToCinemaButton'

export default function ShowsPage() {
  const { entries } = useLibrary()
  const shows = useMemo(() => entries.filter((e) => e.mediaType === 'tv'), [entries])

  return (
    <LibraryBrowser
      entries={shows}
      heading="📺 SHOWS"
      tagline={`${shows.length} series in your cinema`}
      headerAction={<AddToCinemaButton />}
      emptyTitle="no shows yet."
      emptySubtitle="Search for one to add it to the lineup."
      emptyIcon="📺"
      rollHeading="ROLL A SHOW"
      rollSubheading="From your unwatched series."
    />
  )
}
