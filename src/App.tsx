import { Route, Routes } from 'react-router-dom'
import { Navigation } from '@/components/Navigation'
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
import NotFound from '@/pages/NotFound'

export default function App() {
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}
