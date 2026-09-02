import { useLibrary } from '@/lib/libraryStore'
import { Modal } from './Modal'

export function SyncMigrationPrompt() {
  const { pendingMigration, resolveMigration } = useLibrary()
  const count = pendingMigration?.length ?? 0

  return (
    <Modal open={Boolean(pendingMigration)} onClose={() => resolveMigration(false)} label="Bring your tickets with you" maxWidth="max-w-md">
      <div className="px-6 py-8 text-center sm:px-8">
        <h2 className="font-display text-2xl font-semibold text-ink">Bring Your Tickets With You?</h2>
        <p className="mt-3 font-sans text-sm text-ink/65">
          We found {count} ticket{count === 1 ? '' : 's'} saved on this device. Add {count === 1 ? 'it' : 'them'} to
          your cinema account so {count === 1 ? 'it syncs' : 'they sync'} across your devices.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => resolveMigration(true)}
            className="rounded-sm bg-cherry px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wide text-paper transition-transform hover:scale-105"
          >
            Sync My Tickets
          </button>
          <button
            type="button"
            onClick={() => resolveMigration(false)}
            className="rounded-sm border border-ink/25 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wide text-ink/70 transition-colors hover:border-cherry hover:text-cherry"
          >
            Not Now
          </button>
        </div>
      </div>
    </Modal>
  )
}
