interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  large?: boolean
  autoFocus?: boolean
  id?: string
}

export function SearchBar({ value, onChange, placeholder = 'Search for a movie or show…', large, autoFocus, id }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <span aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40">
        🔍
      </span>
      <input
        id={id}
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search movies and shows"
        className={`w-full rounded-full border border-ink/20 bg-paper pl-10 pr-4 font-sans text-ink placeholder:text-ink/35 focus-visible:border-cherry ${
          large ? 'py-3.5 text-base' : 'py-2 text-sm'
        }`}
      />
    </div>
  )
}
