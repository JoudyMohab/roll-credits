import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/lib/authStore'
import { AuthModal } from './AuthModal'

export function AccountButton() {
  const { status } = useAuth()
  const [open, setOpen] = useState(false)

  if (status === 'loading') {
    return <span className="h-4 w-16 shrink-0 animate-pulse rounded-sm bg-ink/10" aria-hidden />
  }

  if (status === 'signedIn') {
    return (
      <Link
        to="/account"
        className="shrink-0 font-mono text-[11px] font-bold uppercase tracking-wide text-ink/55 transition-colors hover:text-cherry"
      >
        My Account
      </Link>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 font-mono text-[11px] font-bold uppercase tracking-wide text-ink/55 transition-colors hover:text-cherry"
      >
        Sign In
      </button>
      <AuthModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
