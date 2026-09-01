import { useMemo } from 'react'
import { useLibrary } from '@/lib/libraryStore'
import { LibraryBrowser } from '@/components/LibraryBrowser'

export default function Watched() {
  const { entries } = useLibrary()
  const watched = useMemo(() => entries.filter((e) => e.watched), [entries])

  return (
    <LibraryBrowser
      entries={watched}
      heading="THE CREDITS HAVE ROLLED"
      tagline="every screening you've already sat through"
      emptyTitle="the credits haven't rolled yet."
      emptySubtitle="Mark something as watched and it'll take its seat here."
      emptyIcon="🎬"
      defaultSort="newest"
      rollMode="raw"
      rollHeading="FEELING NOSTALGIC?"
      rollSubheading="Revisit something from the archive."
    />
  )
}
