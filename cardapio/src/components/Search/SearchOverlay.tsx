import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Search, X } from 'lucide-react'
import type { MenuData } from '@/types'
import { useUI } from '@/context/UIContext'
import { searchMenu } from '@/services/menu.service'
import { formatCurrency, productPrice } from '@/utils'

interface SearchOverlayProps {
  data: MenuData
}

export function SearchOverlay({ data }: SearchOverlayProps) {
  const { searchOpen, closeSearch, openProduct } = useUI()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!searchOpen) {
      setQuery('')
      return
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 80)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [searchOpen, closeSearch])

  const results = useMemo(() => searchMenu(data, query), [data, query])

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-ink/95 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Buscar no cardápio"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 pt-6 sm:px-6">
            <Search size={20} className="shrink-0 text-brass" strokeWidth={1.5} />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar no cardápio..."
              className="w-full border-0 bg-transparent py-3 font-display text-xl text-bone placeholder:text-bone/30 focus:outline-none sm:text-2xl"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={closeSearch}
              aria-label="Fechar busca"
              className="touch-target inline-flex items-center justify-center text-bone/60 hover:text-brass"
            >
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>

          <div className="mx-auto mt-2 h-px w-full max-w-2xl bg-line px-4" />

          <div className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            {query.trim() && results.length === 0 && (
              <p className="text-bone/45">Nenhum resultado para “{query}”.</p>
            )}
            <ul className="space-y-1">
              {results.map(({ product, categoryName }) => (
                <li key={product.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-4 px-2 py-3 text-left transition-colors hover:bg-ink-elevated"
                    onClick={() => {
                      closeSearch()
                      openProduct(product)
                    }}
                  >
                    <img
                      src={product.imageUrl}
                      alt=""
                      className="h-14 w-12 object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.65rem] tracking-[0.18em] text-brass uppercase">
                        {categoryName}
                      </p>
                      <p className="font-display text-lg text-bone">{product.name}</p>
                      <p className="truncate text-sm text-bone/45">{product.description}</p>
                    </div>
                    <span className="shrink-0 font-display text-brass">
                      {formatCurrency(productPrice(product))}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
