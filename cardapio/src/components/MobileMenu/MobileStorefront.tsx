import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock, MapPin, Search } from 'lucide-react'
import type { Category, MenuData } from '@/types'
import { cn } from '@/utils'
import { MobileProductRow } from '@/components/MobileMenu/MobileProductRow'
import { StoreMark } from '@/components/StoreMark'

interface MobileStorefrontProps {
  data: MenuData
}

function prepRange(minutes?: number | null): string | null {
  if (!minutes || minutes <= 0) return null
  return `${minutes}–${minutes + 10} min`
}

function mapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

function InstagramIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}

function filterCategories(categories: Category[], query: string): Category[] {
  const q = query.trim().toLowerCase()
  if (!q) return categories.filter((c) => c.products.length > 0)

  return categories
    .map((cat) => ({
      ...cat,
      products: cat.products.filter((p) => {
        const hay = `${p.name} ${p.description} ${cat.name}`.toLowerCase()
        return hay.includes(q)
      }),
    }))
    .filter((c) => c.products.length > 0)
}

export function MobileStorefront({ data }: MobileStorefrontProps) {
  const { store, categories } = data
  const [query, setQuery] = useState('')
  const [activeCat, setActiveCat] = useState(categories[0]?.id ?? '')
  const clickingRef = useRef(false)
  const pillRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const banner = store.images[0]
  const wait = prepRange(store.estimatedMinutes)
  const visible = useMemo(() => filterCategories(categories, query), [categories, query])
  const searching = query.trim().length > 0

  useEffect(() => {
    if (searching || visible.length === 0) return

    const elements = visible
      .map((c) => document.getElementById(`cat-${c.id}`))
      .filter(Boolean) as HTMLElement[]

    if (!elements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (clickingRef.current) return
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        const id = hit?.target.id.replace(/^cat-/, '')
        if (id) setActiveCat(id)
      },
      { rootMargin: '-88px 0px -62% 0px', threshold: [0.08, 0.2] },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [visible, searching])

  useEffect(() => {
    pillRefs.current.get(activeCat)?.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: 'smooth',
    })
  }, [activeCat])

  const scrollToCategory = (id: string) => {
    clickingRef.current = true
    setActiveCat(id)
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => {
      clickingRef.current = false
    }, 700)
  }

  return (
    <div data-mobile-menu className="lg:hidden">
      <section className="relative overflow-hidden" aria-label={store.name}>
        <div className="relative h-[min(58vw,17.5rem)] min-h-56 overflow-hidden">
          {banner ? (
            <img
              src={banner.url}
              alt=""
              className="h-full w-full scale-105 object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(ellipse_at_top,rgb(212_146_58/0.28),transparent_50%),linear-gradient(180deg,#252836_0%,#0d0f17_100%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/15" />
          <div className="grain pointer-events-none absolute inset-0" />
        </div>

        <div className="relative z-10 -mt-16 flex flex-col items-center px-5 text-center">
          <StoreMark store={store} size="lg" />

          <h1 className="mt-4 font-display text-[1.65rem] leading-tight font-bold tracking-tight text-bone">
            {store.name}
          </h1>
          {store.tagline && (
            <p className="mt-1.5 max-w-sm text-sm leading-snug text-bone-muted">
              {store.tagline}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium',
                store.isOpen
                  ? 'bg-emerald-950/70 text-emerald-400'
                  : 'bg-[#3a1518] text-[#f07178]',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  store.isOpen ? 'animate-pulse bg-emerald-400' : 'bg-[#f07178]',
                )}
              />
              {store.isOpen ? 'Aberto' : 'Fechado'}
            </span>
            {wait && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ink-elevated px-2.5 py-1 text-[0.75rem] text-bone-muted">
                <Clock size={13} strokeWidth={1.8} />
                {wait}
              </span>
            )}
          </div>
        </div>

        <div className="px-4">
          <div className={cn('mt-5 grid gap-2', store.address ? 'grid-cols-2' : 'grid-cols-1')}>
            {store.address && (
              <a
                href={mapsUrl(store.address)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-ink-elevated py-2.5 text-sm text-bone no-underline"
              >
                <MapPin size={15} strokeWidth={1.8} />
                Como chegar
              </a>
            )}
            <a
              href={`https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(store.name)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-ink-elevated py-2.5 text-sm text-bone no-underline"
            >
              <InstagramIcon size={15} />
              Instagram
            </a>
          </div>

          <label className="mt-4 flex items-center gap-2.5 rounded-full bg-black/40 px-4 py-3 ring-1 ring-white/10">
            <Search size={16} strokeWidth={1.8} className="shrink-0 text-bone-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por prato ou ingrediente..."
              className="w-full border-0 bg-transparent text-sm text-bone placeholder:text-bone-muted focus:outline-none"
              autoComplete="off"
            />
          </label>
        </div>
      </section>

      {!searching && visible.length > 0 && (
        <nav
          aria-label="Categorias"
          className="sticky top-0 z-20 mt-4 bg-ink/95 px-4 py-3 backdrop-blur-md"
          style={{ paddingTop: 'max(0.75rem, var(--safe-top))' }}
        >
          <div className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visible.map((cat) => {
              const active = cat.id === activeCat
              return (
                <button
                  key={cat.id}
                  type="button"
                  ref={(el) => {
                    if (el) pillRefs.current.set(cat.id, el)
                    else pillRefs.current.delete(cat.id)
                  }}
                  onClick={() => scrollToCategory(cat.id)}
                  className={cn(
                    'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                    active ? 'bg-brass text-ink' : 'bg-transparent text-bone-muted',
                  )}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>
        </nav>
      )}

      <div className="px-4 pt-2 pb-dock">
        {visible.length === 0 ? (
          <p className="py-16 text-center text-sm text-bone-muted">
            Nenhum prato encontrado{query.trim() ? ` para “${query.trim()}”` : ''}.
          </p>
        ) : (
          visible.map((cat) => (
            <section
              key={cat.id}
              id={`cat-${cat.id}`}
              className="scroll-mt-[calc(4.25rem+var(--safe-top))] pt-5"
            >
              <h2 className="mb-3 text-[0.7rem] font-semibold tracking-[0.18em] text-bone-muted uppercase">
                {cat.name}
              </h2>
              <ul className="space-y-2.5">
                {cat.products.map((product) => (
                  <li key={product.id}>
                    <MobileProductRow product={product} />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

        <p className="mt-10 pb-4 text-center text-[0.65rem] tracking-[0.16em] text-bone/30 uppercase">
          {store.name} · comeon
        </p>
      </div>
    </div>
  )
}
