import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/authStore'
import { useLibrary } from '@/lib/libraryStore'
import { Modal } from '@/components/Modal'

export default function AccountPage() {
  const { status, user, signOut, updatePassword, deleteAccount } = useAuth()
  const { entries, isCloudSynced, syncError, isSyncing } = useLibrary()

  const [changingPassword, setChangingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSaved, setPasswordSaved] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const stats = useMemo(() => {
    const watched = entries.filter((e) => e.watched).length
    const watchlist = entries.filter((e) => e.watchlisted && !e.watched).length
    return { total: entries.length, watched, watchlist }
  }, [entries])

  if (status === 'loading') {
    return (
      <section className="mx-auto max-w-xl px-5 py-16 text-center">
        <p className="font-mono text-xs uppercase tracking-wide text-ink/50">Checking the box office…</p>
      </section>
    )
  }

  if (status !== 'signedIn' || !user) {
    return <Navigate to="/" replace />
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSaved(false)
    if (newPassword.length < 6) {
      setPasswordError('Your password needs at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Those details don't match.")
      return
    }
    const result = await updatePassword(newPassword)
    if (result.error) {
      setPasswordError(result.error)
      return
    }
    setPasswordSaved(true)
    setChangingPassword(false)
    setNewPassword('')
    setConfirmPassword('')
  }

  async function handleDelete() {
    setDeleteError(null)
    setDeleting(true)
    const result = await deleteAccount()
    setDeleting(false)
    if (result.error) {
      setDeleteError(result.error)
    }
  }

  return (
    <section className="mx-auto max-w-xl px-5 py-12">
      <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">My Account</h1>
      <p className="mt-1 font-sans text-sm text-ink/55">{user.email}</p>

      <div className="mt-8 rounded-md border border-ink/15 bg-paper-secondary/40 p-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink/40">Your Cinema</p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm text-ink/80">
          <span>
            <strong className="font-display text-xl text-cherry">{stats.total}</strong> titles
          </span>
          <span>
            <strong className="font-display text-xl text-cherry">{stats.watched}</strong> watched
          </span>
          <span>
            <strong className="font-display text-xl text-cherry">{stats.watchlist}</strong> on watchlist
          </span>
        </div>

        <div className="mt-4 border-t border-dashed border-ink/15 pt-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink/40">Sync Status</p>
          {syncError ? (
            <p className="mt-1 font-sans text-sm text-burgundy">{syncError}</p>
          ) : isSyncing ? (
            <p className="mt-1 font-sans text-sm text-ink/60">Syncing your tickets…</p>
          ) : isCloudSynced ? (
            <p className="mt-1 font-sans text-sm text-ink/60">✓ Synced to your account</p>
          ) : (
            <p className="mt-1 font-sans text-sm text-ink/60">Loading your synced cinema…</p>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4">
        <div>
          {!changingPassword ? (
            <button
              type="button"
              onClick={() => {
                setChangingPassword(true)
                setPasswordSaved(false)
              }}
              className="font-mono text-xs font-bold uppercase tracking-wide text-ink/60 hover:text-cherry"
            >
              Change Password
            </button>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3 rounded-sm border border-ink/15 p-4">
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink/40">
                  New Password
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                  className="rounded-sm border border-ink/20 bg-paper px-3 py-2 font-sans text-sm text-ink focus-visible:border-cherry"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink/40">
                  Confirm Password
                </span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  required
                  className="rounded-sm border border-ink/20 bg-paper px-3 py-2 font-sans text-sm text-ink focus-visible:border-cherry"
                />
              </label>
              {passwordError && <p className="font-sans text-sm text-burgundy">{passwordError}</p>}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="rounded-sm bg-cherry px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wide text-paper"
                >
                  Save Password
                </button>
                <button
                  type="button"
                  onClick={() => setChangingPassword(false)}
                  className="font-mono text-[11px] font-bold uppercase tracking-wide text-ink/50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {passwordSaved && <p className="mt-2 font-sans text-sm text-ink/60">Password updated.</p>}
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="self-start font-mono text-xs font-bold uppercase tracking-wide text-ink/60 hover:text-cherry"
        >
          Sign Out
        </button>

        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="self-start font-mono text-xs font-bold uppercase tracking-wide text-ink/40 hover:text-burgundy"
        >
          Delete Account
        </button>
      </div>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} label="Delete account" maxWidth="max-w-md">
        <div className="px-6 py-8 sm:px-8">
          <h2 className="font-display text-2xl font-semibold text-burgundy">Delete Your Cinema?</h2>
          <p className="mt-2 font-sans text-sm text-ink/70">
            This permanently deletes your account and every synced ticket, rating and note in the cloud. This cannot
            be undone.
          </p>
          <label className="mt-5 flex flex-col gap-1.5">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink/40">
              Type DELETE to confirm
            </span>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="rounded-sm border border-burgundy/30 bg-paper px-3 py-2 font-sans text-sm text-ink focus-visible:border-burgundy"
            />
          </label>
          {deleteError && <p className="mt-3 font-sans text-sm text-burgundy">{deleteError}</p>}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={deleteConfirmText !== 'DELETE' || deleting}
              onClick={handleDelete}
              className="rounded-sm bg-burgundy px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wide text-paper transition-opacity disabled:opacity-40"
            >
              {deleting ? 'Deleting…' : 'Delete My Cinema'}
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              className="font-mono text-xs font-bold uppercase tracking-wide text-ink/50"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
