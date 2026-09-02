import { useLibrary } from '@/lib/libraryStore'

export function SyncErrorBanner() {
  const { syncError } = useLibrary()
  if (!syncError) return null

  return (
    <div
      role="alert"
      className="fixed inset-x-0 bottom-16 z-30 mx-auto w-fit max-w-[92vw] rounded-sm border border-burgundy/40 bg-paper px-4 py-2.5 text-center shadow-[var(--shadow-ticket-hover)] md:bottom-4"
    >
      <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-burgundy">
        The Projector Lost Signal.
      </p>
      <p className="font-sans text-xs text-ink/60">{syncError}</p>
    </div>
  )
}
