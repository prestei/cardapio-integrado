import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar no cardápio',
}: SearchBarProps) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        strokeWidth={1.75}
        aria-hidden
      />
      <label className="sr-only" htmlFor="menu-search">
        Pesquisar produtos
      </label>
      <input
        id="menu-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-[var(--radius-md)] border border-line bg-canvas pl-10 pr-10 text-sm text-ink placeholder:text-muted outline-none transition focus:border-ink/30"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded text-muted transition hover:bg-surface-2 hover:text-ink"
          aria-label="Limpar pesquisa"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
