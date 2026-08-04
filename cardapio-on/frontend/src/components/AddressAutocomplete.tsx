import { useEffect, useId, useRef, useState } from 'react'
import { apiFetch } from '@/services/api'

export interface AddressSuggestion {
  placeId: string
  description: string
}

interface AddressAutocompleteProps {
  slug: string
  value: string
  onChange: (value: string) => void
  onSelect?: (suggestion: AddressSuggestion) => void
  label?: string
  required?: boolean
  id?: string
}

/**
 * Autocomplete de endereço via API pública (Google Places no backend).
 * Se o serviço estiver indisponível, o campo continua editável manualmente.
 */
export function AddressAutocomplete({
  slug,
  value,
  onChange,
  onSelect,
  label = 'Rua',
  required,
  id,
}: AddressAutocompleteProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const listId = `${inputId}-list`
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [status, setStatus] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!slug || value.trim().length < 3) {
      setSuggestions([])
      setStatus('')
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const result = await apiFetch<AddressSuggestion[]>(
          `/public/${slug}/geo/autocomplete?q=${encodeURIComponent(value.trim())}`,
        )
        setSuggestions(result)
        setOpen(result.length > 0)
        setActiveIndex(-1)
        setStatus(
          result.length > 0
            ? `${result.length} sugestões de endereço`
            : 'Nenhuma sugestão encontrada; digite o endereço manualmente.',
        )
      } catch {
        setSuggestions([])
        setStatus('Autocomplete indisponível; continue com o endereço manual.')
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [slug, value])

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const choose = (suggestion: AddressSuggestion) => {
    onChange(suggestion.description)
    onSelect?.(suggestion)
    setOpen(false)
    setSuggestions([])
    setStatus(`Endereço selecionado: ${suggestion.description}`)
  }

  return (
    <div ref={wrapRef} className="relative block">
      <label htmlFor={inputId}>
        <span className="mb-1.5 block text-sm text-ink-soft">{label}</span>
        <input
          id={inputId}
          required={required}
          value={value}
          autoComplete="street-address"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          aria-activedescendant={
            activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
          }
          role="combobox"
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true)
          }}
          onKeyDown={(e) => {
            if (!open || suggestions.length === 0) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActiveIndex((i) => Math.max(i - 1, 0))
            } else if (e.key === 'Enter' && activeIndex >= 0) {
              e.preventDefault()
              choose(suggestions[activeIndex]!)
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
          className="h-11 w-full rounded-[var(--radius-md)] border border-line px-3 text-sm outline-none focus:border-ink/30 focus-visible:ring-2 focus-visible:ring-ink/20"
        />
      </label>
      <div className="sr-only" role="status" aria-live="polite">
        {status}
      </div>
      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-[var(--radius-md)] border border-line bg-canvas shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.placeId}
              id={`${listId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`cursor-pointer px-3 py-2 text-sm ${
                index === activeIndex ? 'bg-surface-2 text-ink' : 'text-ink-soft hover:bg-surface-2'
              }`}
              onMouseDown={(e) => {
                e.preventDefault()
                choose(suggestion)
              }}
            >
              {suggestion.description}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
