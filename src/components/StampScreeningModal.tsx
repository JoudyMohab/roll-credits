import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Modal } from './Modal'
import { RatingInput } from './RatingInput'

interface StampScreeningModalProps {
  open: boolean
  onClose: () => void
  title: string
  initialRating: number | null
  initialNote: string
  onSubmit: (rating: number | null, note: string) => void
}

export function StampScreeningModal({
  open,
  onClose,
  title,
  initialRating,
  initialNote,
  onSubmit,
}: StampScreeningModalProps) {
  const [rating, setRating] = useState<number | null>(initialRating)
  const [note, setNote] = useState(initialNote)
  const [stamped, setStamped] = useState(false)

  function handleClose() {
    setStamped(false)
    onClose()
  }

  function handleSubmit() {
    onSubmit(rating, note)
    setStamped(true)
    window.setTimeout(handleClose, 1100)
  }

  return (
    <Modal open={open} onClose={handleClose} label="Rate this screening" maxWidth="max-w-md">
      <div className="relative overflow-hidden px-8 py-10 text-center">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-cherry">
          The Credits Have Rolled
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-ink">How was tonight's screening?</h2>
        <p className="mt-1 font-sans text-sm text-ink/50">{title}</p>

        <div className="mt-6 flex justify-center">
          <RatingInput value={rating} onChange={setRating} size="large" />
        </div>

        <div className="mt-6 text-left">
          <label htmlFor="screening-note" className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink/50">
            Want to leave a note? (optional)
          </label>
          <textarea
            id="screening-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Cried during the third act..."
            className="mt-2 w-full resize-none rounded-sm border border-ink/20 bg-paper px-3 py-2 font-sans text-sm text-ink placeholder:text-ink/30 focus-visible:border-cherry"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="mt-7 w-full rounded-sm bg-cherry py-3 font-mono text-sm font-bold uppercase tracking-wide text-paper transition-transform hover:scale-[1.02] active:scale-[0.99]"
        >
          🎟️ Stamp My Ticket
        </button>

        <AnimatePresence>
          {stamped && (
            <motion.div
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-paper/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 2.4, opacity: 0, rotate: -18 }}
                animate={{ scale: 1, opacity: 1, rotate: -12 }}
                transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                className="rounded-md border-4 border-cherry px-6 py-3 font-mono text-xl font-black uppercase tracking-widest text-cherry"
              >
                Admitted
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  )
}
