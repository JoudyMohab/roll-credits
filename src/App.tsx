import { Route, Routes } from 'react-router-dom'
import { Navigation } from '@/components/Navigation'
import { SyncMigrationPrompt } from '@/components/SyncMigrationPrompt'
import { SyncErrorBanner } from '@/components/SyncErrorBanner'
import { useAuth } from '@/lib/authStore'
import { useLibrary } from '@/lib/libraryStore'
import Home from '@/pages/Home'
import Watchlist from '@/pages/Watchlist'
import Watched from '@/pages/Watched'
import MoviesPage from '@/pages/MoviesPage'
import ShowsPage from '@/pages/ShowsPage'
import Browse from '@/pages/Browse'
import GenrePage from '@/pages/GenrePage'
import Search from '@/pages/Search'
import MediaDetailPage from '@/pages/MediaDetailPage'
import ImportReview from '@/pages/ImportReview'
import AccountPage from '@/pages/AccountPage'
import NotFound from '@/pages/NotFound'

export default function App() {
  const { status } = useAuth()
  const { isCloudSynced } = useLibrary()

  // While signed in, entries pages read straight from the cloud library and treat
  // "no entries yet" as a genuine empty state. Without this gate, that empty state
  // would flash for a moment between sign-in and the cloud fetch resolving (and
  // again on an account switch, where the previous account's data is cleared
  // before the new one loads) — so hold the same loading screen open until then.
  if (status === 'loading' || (status === 'signedIn' && !isCloudSynced)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-ink/40">Checking the box office…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Navigation />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/shows" element={<ShowsPage />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/watched" element={<Watched />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/browse/:genreId" element={<GenrePage />} />
          <Route path="/search" element={<Search />} />
          <Route path="/title/:mediaType/:id" element={<MediaDetailPage />} />
          <Route path="/review" element={<ImportReview />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <SyncMigrationPrompt />
      <SyncErrorBanner />
    </div>
  )
}
