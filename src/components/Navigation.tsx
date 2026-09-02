import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { SearchBar } from './SearchBar'
import { ThemeToggle } from './ThemeToggle'
import { AccountButton } from './AccountButton'

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/movies', label: 'Movies' },
  { to: '/shows', label: 'Shows' },
  { to: '/watchlist', label: 'Watchlist' },
  { to: '/watched', label: 'Watched' },
  { to: '/browse', label: 'Browse' },
]

const MOBILE_LINKS = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/watchlist', label: 'List', icon: '🎟️' },
  { to: '/browse', label: 'Browse', icon: '🎭' },
  { to: '/watched', label: 'Watched', icon: '✓' },
  { to: '/search', label: 'Search', icon: '🔍' },
]

export function Navigation() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function handleSearchChange(value: string) {
    setQuery(value)
    navigate(`/search?q=${encodeURIComponent(value)}`)
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-5 py-3.5">
          <NavLink to="/" className="flex flex-col leading-none">
            <span className="font-display text-xl font-bold tracking-tight text-cherry">ROLL CREDITS</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink/45">
              things i swear i'll watch eventually
            </span>
          </NavLink>

          <nav className="hidden items-center gap-5 md:flex" aria-label="Primary">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `font-mono text-xs font-bold uppercase tracking-wide transition-colors ${
                    isActive ? 'text-cherry' : 'text-ink/55 hover:text-ink'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex flex-1 items-center gap-3 sm:flex-none">
            <div className="flex-1 sm:w-64 sm:flex-none">
              <SearchBar value={query} onChange={handleSearchChange} placeholder="What are we screening?" />
            </div>
            <AccountButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-ink/10 bg-paper/97 backdrop-blur-sm md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {MOBILE_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 font-mono text-[9px] font-bold uppercase tracking-wide ${
                isActive ? 'text-cherry' : 'text-ink/50'
              }`
            }
          >
            <span aria-hidden className="text-lg leading-none">
              {link.icon}
            </span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
