import { useMemo } from 'react'
import { useLibrary } from '@/lib/libraryStore'
import { LibraryBrowser } from '@/components/LibraryBrowser'

export default function MoviesPage() {
  const { entries } = useLibrary()
  const movies = useMemo(() => entries.filter((e) => e.mediaType === 'movie'), [entries])

  return (
    <LibraryBrowser
      entries={movies}
      heading="🎬 MOVIES"
      tagline={`${movies.length} movie${movies.length === 1 ? '' : 's'} in your cinema`}
      emptyTitle="no movies yet."
      emptySubtitle="Search for one to book its first screening."
      emptyIcon="🎬"
      rollHeading="ROLL A MOVIE"
      rollSubheading="From your unwatched features."
    />
  )
}
