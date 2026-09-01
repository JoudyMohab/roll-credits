import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { LibraryEntry, PickerMode, PickerScope } from '@/types/library'
import { getPickerPool, pickRandom } from '@/lib/random'
import { Modal } from './Modal'
import { MediaTicket } from './MediaTicket'

interface RandomPickerProps {
  entries: LibraryEntry[]
  triggerLabel?: string
  heading?: string
  subheading?: string
  showModeControls?: boolean
  showScopeControls?: boolean
  selectionPool?: LibraryEntry[]
  defaultScope?: PickerScope
  className?: string
}

const SHUFFLE_DELAYS = [70, 80, 95, 115, 145, 190, 250, 330, 420]

export function RandomPicker({
  entries,
  triggerLabel = '🎲 Roll The Credits',
  heading = "CAN'T DECIDE?",
  subheading = 'Let the cinema decide.',
  showModeControls = false,
  showScopeControls = false,
  selectionPool,
  defaultScope = 'all',
  className,
}: RandomPickerProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<PickerMode>(selectionPool ? 'selection' : 'unwatched')
  const [scope, setScope] = useState<PickerScope>(defaultScope)
  const [phase, setPhase] = useState<'idle' | 'shuffling' | 'revealed' | 'empty'>('idle')
  const [shuffleEntry, setShuffleEntry] = useState<LibraryEntry | null>(null)
  const [finalEntry, setFinalEntry] = useState<LibraryEntry | null>(null)
  const [shuffleTick, setShuffleTick] = useState(0)
  const timeouts = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    timeouts.current.forEach((t) => window.clearTimeout(t))
    timeouts.current = []
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const pool = getPickerPool(entries, mode, scope, selectionPool)

  const runRoll = useCallback(() => {
    clearTimers()
    if (pool.length === 0) {
      setPhase('empty')
      return
    }
    setPhase('shuffling')
    setFinalEntry(null)
    const picked = pickRandom(pool)!
    let elapsed = 0
    SHUFFLE_DELAYS.forEach((delay, i) => {
      elapsed += delay
      const isLast = i === SHUFFLE_DELAYS.length - 1
      const t = window.setTimeout(() => {
        setShuffleEntry(isLast ? picked : pickRandom(pool))
        setShuffleTick((n) => n + 1)
        if (isLast) {
          setFinalEntry(picked)
          setPhase('revealed')
        }
      }, elapsed)
      timeouts.current.push(t)
    })
  }, [pool, clearTimers])

  // Re-roll automatically when the filters change, so switching mode/scope
  // updates the selection immediately without a separate "Apply" step.
  useEffect(() => {
    if (!open) return
    runRoll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, scope])

  function handleOpen() {
    setOpen(true)
    setPhase('idle')
    runRoll()
  }

  function handleClose() {
    clearTimers()
    setOpen(false)
  }

  function handleWatchingIt() {
    if (!finalEntry) return
    handleClose()
    navigate(`/title/${finalEntry.mediaType}/${finalEntry.tmdbId}`)
  }

  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-3">
        {heading && (
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-ink/50">{heading}</p>
            {subheading && <p className="font-display text-lg text-ink/80">{subheading}</p>}
          </div>
        )}
        <button
          type="button"
          onClick={handleOpen}
          className="rounded-sm bg-cherry px-6 py-3 font-mono text-sm font-bold uppercase tracking-wide text-paper shadow-[var(--shadow-ticket)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          {triggerLabel}
        </button>
      </div>

      <Modal open={open} onClose={handleClose} label="Roll the credits" maxWidth="max-w-lg">
        <div className="flex flex-col items-center gap-6 px-8 py-12 text-center">
          {(showModeControls || showScopeControls) && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {showModeControls &&
                (['unwatched', 'everything', 'favorites'] as PickerMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wide transition-colors ${
                      mode === m ? 'border-cherry bg-cherry text-paper' : 'border-ink/20 text-ink/60 hover:border-ink/40'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              {showModeControls && showScopeControls && <span className="mx-1 h-4 w-px bg-ink/15" aria-hidden />}
              {showScopeControls &&
                (['all', 'movie', 'tv'] as PickerScope[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScope(s)}
                    className={`rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wide transition-colors ${
                      scope === s ? 'border-gold bg-gold text-ink' : 'border-ink/20 text-ink/60 hover:border-ink/40'
                    }`}
                  >
                    {s === 'all' ? 'Everything' : s === 'movie' ? '🎬 Movies' : '📺 Shows'}
                  </button>
                ))}
            </div>
          )}

          {phase === 'empty' && (
            <div className="py-6">
              <p className="font-display text-xl text-ink">Nothing to roll.</p>
              <p className="mt-1 font-sans text-sm text-ink/50">Nothing in this set yet — try a different mode.</p>
            </div>
          )}

          {(phase === 'shuffling' || phase === 'revealed') && (
            <>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-cherry">
                {phase === 'shuffling' ? 'Rolling the reel…' : "Tonight's Screening"}
              </p>
              <div className="relative flex h-[300px] w-full items-center justify-center">
                <AnimatePresence mode="wait">
                  {shuffleEntry && (
                    <motion.div
                      key={phase === 'revealed' ? 'final' : `${shuffleEntry.tmdbId}-${shuffleEntry.mediaType}-${shuffleTick}`}
                      initial={{ opacity: 0, y: 14, rotate: -2 }}
                      animate={{ opacity: 1, y: 0, rotate: 0 }}
                      exit={{ opacity: 0, y: -14 }}
                      transition={{ duration: phase === 'revealed' ? 0.4 : 0.09 }}
                    >
                      <MediaTicket
                        mediaType={shuffleEntry.mediaType}
                        id={shuffleEntry.tmdbId}
                        fallback={{
                          title: shuffleEntry.cache.title,
                          year: shuffleEntry.cache.year,
                          genreIds: shuffleEntry.cache.genreIds,
                          voteAverage: shuffleEntry.cache.voteAverage,
                        }}
                        variant="library"
                        onOpen={() => {}}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {phase === 'revealed' && (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleWatchingIt}
                    className="rounded-sm bg-cherry px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wide text-paper transition-transform hover:scale-105"
                  >
                    I'm Watching It
                  </button>
                  <button
                    type="button"
                    onClick={runRoll}
                    className="rounded-sm border border-ink/25 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wide text-ink/70 transition-colors hover:border-cherry hover:text-cherry"
                  >
                    Roll Again
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
