import { useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useLibrary } from '@/lib/libraryStore'
import { useGenres } from '@/lib/genreStore'
import { LibraryBrowser } from '@/components/LibraryBrowser'

export default function GenrePage() {
  const { genreId } = useParams()
  const { entries } = useLibrary()
  const genres = useGenres()
  const id = Number(genreId)

  const genre = genres.find((g) => g.id === id)
  const inGenre = useMemo(() => entries.filter((e) => e.cache.genreIds.includes(id)), [entries, id])

  if (genres.length > 0 && !genre) return <Navigate to="/browse" replace />

  const unwatchedCount = inGenre.filter((e) => !e.watched && !e.upcoming).length

  return (
    <LibraryBrowser
      entries={inGenre}
      heading={(genre?.name ?? 'GENRE').toUpperCase()}
      tagline={`${unwatchedCount} title${unwatchedCount === 1 ? '' : 's'} waiting in this genre.`}
      emptyTitle="NOT PLAYING TONIGHT."
      emptySubtitle="Nothing in this genre yet."
      emptyIcon="🎭"
      showGenreFilter={false}
      rollHeading="🎲 ROLL THE CREDITS"
      rollSubheading={`A random pick from ${genre?.name ?? 'this genre'}.`}
    />
  )
}
