import { useMemo } from 'react'
import { useLibrary } from '@/lib/libraryStore'
import { LibraryBrowser } from '@/components/LibraryBrowser'
import { AddToCinemaButton } from '@/components/AddToCinemaButton'
import { Seo } from '@/components/Seo'

export default function MoviesPage() {
  const { entries } = useLibrary()
  const movies = useMemo(() => entries.filter((e) => e.mediaType === 'movie'), [entries])

  return (
    <>
      <Seo
        title="Movies"
        description="Your movie collection on Roll Credits — track what you're watching, what's next, and what you've already seen."
        path="/movies"
      />
      <LibraryBrowser
        entries={movies}
        heading="🎬 MOVIES"
        tagline={`${movies.length} movie${movies.length === 1 ? '' : 's'} in your cinema`}
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Movies' }]}
        headerAction={<AddToCinemaButton />}
        emptyTitle="no movies yet."
        emptySubtitle="Search for one to book its first screening."
        emptyIcon="🎬"
        rollHeading="ROLL A MOVIE"
        rollSubheading="From your unwatched features."
      />
    </>
  )
}
