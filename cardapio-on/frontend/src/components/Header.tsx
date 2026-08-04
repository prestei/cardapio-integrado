import { Link, useParams } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/contexts/StoreContext'
import { useCart } from '@/hooks/useCart'
import { bounceCartBadge } from '@/animations/anime'
import { cn } from '@/utils/cn'

export function Header({ solid = false }: { solid?: boolean }) {
  const { slug } = useParams()
  const { menu } = useStore()
  const { itemCount, openCart, bumpToken } = useCart()
  const badgeRef = useRef<HTMLSpanElement>(null)
  const [cartLiveMessage, setCartLiveMessage] = useState('')

  useEffect(() => {
    if (bumpToken > 0) bounceCartBadge(badgeRef.current)
  }, [bumpToken])

  useEffect(() => {
    if (bumpToken > 0) {
      setCartLiveMessage(`${itemCount} ${itemCount === 1 ? 'item' : 'itens'} no carrinho`)
    }
  }, [bumpToken, itemCount])

  const storeSlug = slug ?? menu?.establishment.slug

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-colors',
        solid
          ? 'border-line bg-canvas/95 backdrop-blur-md'
          : 'border-transparent bg-canvas/80 backdrop-blur-md',
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link
          to={storeSlug ? `/${storeSlug}` : '/'}
          className="flex min-w-0 items-center gap-3"
        >
          {menu?.establishment.logoUrl ? (
            <img
              src={menu.establishment.logoUrl}
              alt=""
              className="h-9 w-9 rounded-[var(--radius-sm)] object-cover"
            />
          ) : (
            <span
              className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] text-sm font-bold"
              style={{
                background: 'var(--store-primary)',
                color: 'var(--store-button-text)',
              }}
              aria-hidden
            >
              {(menu?.establishment.name ?? 'C').slice(0, 1)}
            </span>
          )}
          <span className="truncate text-sm font-semibold tracking-tight text-ink sm:text-base">
            {menu?.establishment.name ?? 'Cardápio'}
          </span>
        </Link>

        <button
          type="button"
          onClick={openCart}
          className="relative grid h-10 w-10 place-items-center rounded-[var(--radius-md)] border border-line bg-canvas text-ink transition hover:border-line-strong hover:bg-surface"
          aria-label={`Abrir carrinho com ${itemCount} itens`}
        >
          <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
          {itemCount > 0 && (
            <span
              ref={badgeRef}
              className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-semibold"
              style={{
                background: 'var(--store-primary)',
                color: 'var(--store-button-text)',
              }}
            >
              {itemCount}
            </span>
          )}
        </button>
        <span className="sr-only" role="status" aria-live="polite">
          {cartLiveMessage}
        </span>
      </div>
    </header>
  )
}
