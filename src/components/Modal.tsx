import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  label: string
  maxWidth?: string
}

export function Modal({ open, onClose, children, label, maxWidth = 'max-w-2xl' }: ModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  // Callers often pass an inline onClose that gets a new identity on every render
  // (e.g. whenever their own state changes, such as a keystroke in a form field).
  // Reading it via a ref — rather than listing it as an effect dependency — means
  // typing in the modal can never re-run the open effect below and re-steal focus
  // onto the close button.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={`relative z-10 max-h-[88vh] w-full ${maxWidth} overflow-y-auto rounded-lg border border-ink/15 bg-paper shadow-2xl`}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-ink/20 bg-paper font-sans text-lg leading-none text-ink/70 hover:bg-cherry hover:text-paper"
            >
              ×
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
