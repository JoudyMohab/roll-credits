import type { Genre } from '@/types/media'

interface GenreFilterProps {
  genres: Genre[]
  selected: number | null
  onSelect: (id: number | null) => void
}

export function GenreFilter({ genres, selected, onSelect }: GenreFilterProps) {
  return (
    <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by genre">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`shrink-0 rounded-full border px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide transition-colors ${
          selected === null ? 'border-cherry bg-cherry text-paper' : 'border-ink/20 text-ink/60 hover:border-ink/40'
        }`}
      >
        All Genres
      </button>
      {genres.map((g) => (
        <button
          key={g.id}
          type="button"
          onClick={() => onSelect(g.id)}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wide transition-colors ${
            selected === g.id ? 'border-cherry bg-cherry text-paper' : 'border-ink/20 text-ink/60 hover:border-ink/40'
          }`}
        >
          {g.name}
        </button>
      ))}
    </div>
  )
}
