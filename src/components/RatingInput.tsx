import { useState } from 'react'

interface RatingInputProps {
  value: number | null
  onChange: (rating: number) => void
  size?: 'default' | 'large'
}

export function RatingInput({ value, onChange, size = 'default' }: RatingInputProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const display = hovered ?? value ?? 0
  const starSize = size === 'large' ? 'text-4xl' : 'text-2xl'

  return (
    <div role="radiogroup" aria-label="Your rating" className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? '' : 's'}`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          onFocus={() => setHovered(star)}
          onBlur={() => setHovered(null)}
          onClick={() => onChange(star)}
          className={`${starSize} leading-none transition-transform hover:scale-110 focus-visible:scale-110`}
        >
          <span className={`transition-colors duration-150 ${star <= display ? 'text-cherry' : 'text-ink/20'}`}>
            {star <= display ? '★' : '☆'}
          </span>
        </button>
      ))}
    </div>
  )
}
