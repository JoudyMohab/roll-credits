import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

export function TicketGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-x-5 gap-y-8 justify-items-center sm:justify-items-stretch">
      {children}
    </div>
  )
}

export function TicketGridItem({ children, index = 0 }: { children: ReactNode; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.035, 0.4), ease: 'easeOut' }}
      className="flex w-full justify-center"
    >
      {children}
    </motion.div>
  )
}
