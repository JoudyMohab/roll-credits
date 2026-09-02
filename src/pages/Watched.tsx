import { useMemo } from 'react'
import { useLibrary } from '@/lib/libraryStore'
import { LibraryBrowser } from '@/components/LibraryBrowser'
import { Seo } from '@/components/Seo'

export default function Watched() {
  const { entries } = useLibrary()
  const watched = useMemo(() => entries.filter((e) => e.watched), [entries])

  return (
    <>
      <Seo
        title="Watched"
        description="Every screening you've already sat through — your full watch history on Roll Credits."
        path="/watched"
      />
      <LibraryBrowser
        entries={watched}
        heading="THE CREDITS HAVE ROLLED"
        tagline="every screening you've already sat through"
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Watched' }]}
        emptyTitle="the credits haven't rolled yet."
        emptySubtitle="Mark something as watched and it'll take its seat here."
        emptyIcon="🎬"
        defaultSort="newest"
        rollMode="raw"
        rollHeading="FEELING NOSTALGIC?"
        rollSubheading="Revisit something from the archive."
      />
    </>
  )
}
