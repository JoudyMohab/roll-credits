import { useMemo } from 'react'
import { useLibrary } from '@/lib/libraryStore'
import { LibraryBrowser } from '@/components/LibraryBrowser'
import { AddToCinemaButton } from '@/components/AddToCinemaButton'
import { Seo } from '@/components/Seo'

export default function ShowsPage() {
  const { entries } = useLibrary()
  const shows = useMemo(() => entries.filter((e) => e.mediaType === 'tv'), [entries])

  return (
    <>
      <Seo
        title="Shows"
        description="Your TV show collection on Roll Credits — track what's airing, what's next, and every series you've finished."
        path="/shows"
      />
      <LibraryBrowser
        entries={shows}
        heading="📺 SHOWS"
        tagline={`${shows.length} series in your cinema`}
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Shows' }]}
        headerAction={<AddToCinemaButton />}
        emptyTitle="no shows yet."
        emptySubtitle="Search for one to add it to the lineup."
        emptyIcon="📺"
        rollHeading="ROLL A SHOW"
        rollSubheading="From your unwatched series."
      />
    </>
  )
}
