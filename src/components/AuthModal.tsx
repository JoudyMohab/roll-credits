import { useState } from 'react'
import { useAuth } from '@/lib/authStore'
import { Modal } from './Modal'

type Mode = 'signin' | 'signup' | 'reset'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
    setNotice(null)
    setPassword('')
    setConfirmPassword('')
  }

  function handleClose() {
    switchMode('signin')
    setEmail('')
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)

    if (!EMAIL_RE.test(email.trim())) {
      setError("That email doesn't look right.")
      return
    }

    if (mode === 'reset') {
      setSubmitting(true)
      const result = await resetPassword(email.trim())
      setSubmitting(false)
      if (result.error) {
        setError(result.error)
        return
      }
      setNotice('CHECK YOUR INBOX.')
      return
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setError('Your password needs at least 6 characters.')
        return
      }
      if (password !== confirmPassword) {
        setError("Those details don't match.")
        return
      }
      setSubmitting(true)
      const result = await signUp(email.trim(), password)
      setSubmitting(false)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.needsEmailConfirmation) {
        setNotice('CHECK YOUR INBOX.')
      } else {
        handleClose()
      }
      return
    }

    setSubmitting(true)
    const result = await signIn(email.trim(), password)
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
      return
    }
    handleClose()
  }

  const heading =
    mode === 'signup' ? 'WELCOME TO YOUR CINEMA' : mode === 'reset' ? 'FORGOT YOUR PASSWORD?' : 'ENTER THE CINEMA'
  const subheading =
    mode === 'signup'
      ? 'Create an account to keep your tickets, watchlist and screenings synced across devices.'
      : mode === 'reset'
        ? "We'll send you a link to set a new password."
        : 'Sign in to pick up right where you left off.'
  const submitLabel = mode === 'signup' ? 'Create My Cinema' : mode === 'reset' ? 'Send Reset Link' : 'Enter The Cinema'

  return (
    <Modal open={open} onClose={handleClose} label={heading} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="px-6 py-8 sm:px-8">
        <h2 className="font-display text-2xl font-semibold text-ink">{heading}</h2>
        <p className="mt-1 font-sans text-sm text-ink/55">{subheading}</p>

        {notice ? (
          <div className="mt-6 rounded-sm border border-cherry/30 bg-cherry/5 px-4 py-4 text-center">
            <p className="font-mono text-xs font-bold uppercase tracking-wide text-cherry">{notice}</p>
            <p className="mt-1 font-sans text-sm text-ink/60">
              {mode === 'reset'
                ? "If there's an account with that email, a reset link is on its way."
                : "Confirm your email to finish setting up your cinema."}
            </p>
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="mt-4 font-mono text-[11px] font-bold uppercase tracking-wide text-cherry hover:underline"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink/40">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="rounded-sm border border-ink/20 bg-paper px-3 py-2 font-sans text-sm text-ink focus-visible:border-cherry"
                />
              </label>

              {mode !== 'reset' && (
                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink/40">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    required
                    minLength={6}
                    className="rounded-sm border border-ink/20 bg-paper px-3 py-2 font-sans text-sm text-ink focus-visible:border-cherry"
                  />
                </label>
              )}

              {mode === 'signup' && (
                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink/40">
                    Confirm Password
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="rounded-sm border border-ink/20 bg-paper px-3 py-2 font-sans text-sm text-ink focus-visible:border-cherry"
                  />
                </label>
              )}

              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="self-start font-mono text-[10px] font-bold uppercase tracking-wide text-ink/45 hover:text-cherry"
                >
                  Forgot your password?
                </button>
              )}
            </div>

            {error && (
              <p className="mt-4 rounded-sm border border-burgundy/30 bg-burgundy/5 px-3 py-2 font-sans text-sm text-burgundy">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-sm bg-cherry py-3 font-mono text-sm font-bold uppercase tracking-wide text-paper transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60"
            >
              {submitting ? 'One moment…' : submitLabel}
            </button>

            <p className="mt-5 text-center font-sans text-sm text-ink/50">
              {mode === 'signup' ? (
                <>
                  Already have a cinema?{' '}
                  <button type="button" onClick={() => switchMode('signin')} className="font-semibold text-cherry hover:underline">
                    Sign in
                  </button>
                </>
              ) : mode === 'reset' ? (
                <button type="button" onClick={() => switchMode('signin')} className="font-semibold text-cherry hover:underline">
                  Back to sign in
                </button>
              ) : (
                <>
                  New here?{' '}
                  <button type="button" onClick={() => switchMode('signup')} className="font-semibold text-cherry hover:underline">
                    Create account
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </form>
    </Modal>
  )
}
