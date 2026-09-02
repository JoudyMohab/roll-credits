import { useState } from 'react'
import { AddToCinemaModal } from './AddToCinemaModal'

export function AddToCinemaButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full border border-cherry/40 px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide text-cherry transition-colors hover:bg-cherry hover:text-paper"
      >
        + Add To Cinema
      </button>
      <AddToCinemaModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
