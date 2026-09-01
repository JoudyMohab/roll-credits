import type { TicketMeta } from '@/types/library'

function hash(str: string): number {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i)
  }
  return Math.abs(h)
}

export function makeTicketMeta(seed: string, screeningNumber: number): TicketMeta {
  const h = hash(seed)
  const rotation = ((h % 21) - 10) / 6.5 // ~ -1.5deg .. 1.5deg
  const tone = h % 3
  const serial = `RC-${String(h % 100000).padStart(6, '0')}`
  return { screeningNumber, rotation, tone, serial }
}
