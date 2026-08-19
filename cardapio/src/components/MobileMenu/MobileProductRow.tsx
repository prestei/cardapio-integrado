import type { MouseEvent } from 'react'
import { Plus } from 'lucide-react'
import type { Product } from '@/types'
import { useCart } from '@/context/CartContext'
import { useUI } from '@/context/UIContext'
import { cn, formatCurrency, productPrice } from '@/utils'

interface MobileProductRowProps {
  product: Product
}

function productBadge(product: Product): string | null {
  if (product.promoPrice != null && product.promoPrice < product.price) return 'Prato do dia'
  if (product.isFeatured) return 'Mais vendido'
  const tag = product.tags?.find((t) => t.trim())
  return tag ?? null
}

export function MobileProductRow({ product }: MobileProductRowProps) {
  const { openProduct } = useUI()
  const { addItem } = useCart()
  const price = productPrice(product)
  const hasPromo = product.promoPrice != null && product.promoPrice < product.price
  const badge = productBadge(product)
  const available = product.isAvailable

  const add = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!available) return
    if (product.hasAdditionals) {
      openProduct(product)
      return
    }
    addItem({ product, quantity: 1 })
  }

  return (
    <article className="relative flex gap-3 rounded-2xl bg-ink-soft p-3">
      <button
        type="button"
        onClick={() => openProduct(product)}
        className="flex min-w-0 flex-1 gap-3 text-left"
      >
        <div className="relative h-[5.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-xl bg-ink">
          <img
            src={product.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className={cn('h-full w-full object-cover', !available && 'opacity-40')}
          />
          {!available && (
            <span className="absolute inset-0 grid place-items-center text-[0.65rem] font-semibold tracking-[0.16em] text-red-400 uppercase">
              Esgotado
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col pr-10">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-[0.95rem] leading-snug font-semibold text-bone">
              {product.name}
            </h3>
            {badge && (
              <span className="shrink-0 rounded-full border border-brass/25 bg-ink/60 px-2 py-0.5 text-[0.55rem] font-semibold tracking-[0.12em] text-brass uppercase">
                {badge}
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-0.5 line-clamp-2 text-[0.78rem] leading-snug text-bone-muted">
              {product.description}
            </p>
          )}

          <div className="mt-auto flex items-baseline gap-1.5 pt-2">
            <span className="font-display text-[0.95rem] font-semibold text-brass">
              {formatCurrency(price)}
            </span>
            {hasPromo && (
              <span className="text-[0.7rem] text-bone/35 line-through">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={add}
        disabled={!available}
        aria-label={`Adicionar ${product.name}`}
        className={cn(
          'absolute right-3 bottom-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-cta text-white',
          !available && 'pointer-events-none opacity-30',
        )}
      >
        <Plus size={18} strokeWidth={2.4} />
      </button>
    </article>
  )
}
