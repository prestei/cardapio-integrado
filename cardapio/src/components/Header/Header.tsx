import { motion } from 'motion/react'
import { Search, ShoppingBag } from 'lucide-react'
import { useCart } from '@/context/CartContext'
import { useUI } from '@/context/UIContext'
import type { Store } from '@/types'
import { cn, formatCurrency } from '@/utils'

interface HeaderProps {
  store: Store
  compact?: boolean
}

export function Header({ store, compact }: HeaderProps) {
  const { openSearch } = useUI()
  const { itemCount, subtotal, openCart, lastAddedAt } = useCart()
  const hideMobileCart = itemCount > 0

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-[background,backdrop-filter,border-color] duration-500',
        compact
          ? 'border-b border-line/40 bg-ink/80 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent',
      )}
      style={{ paddingTop: 'var(--safe-top)' }}
    >
      <div
        className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        style={{ height: 'var(--header-h)' }}
      >
        <a
          href="#loja"
          className="group flex items-center gap-3 no-underline"
          aria-label={`${store.name} — início`}
        >
          <span className="font-display text-base font-bold tracking-[0.18em] text-bone sm:text-xl sm:tracking-[0.2em]">
            {store.name}
          </span>
          {store.isOpen && (
            <span className="hidden items-center gap-1.5 text-[0.65rem] tracking-[0.18em] uppercase text-brass sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brass" />
              Aberto
            </span>
          )}
        </a>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={openSearch}
            aria-label="Buscar no cardápio"
            className="touch-target inline-flex items-center justify-center text-bone/80 transition-colors hover:text-brass"
          >
            <Search size={20} strokeWidth={1.5} />
          </button>

          <motion.button
            type="button"
            onClick={openCart}
            aria-label={`Carrinho, ${itemCount} itens, ${formatCurrency(subtotal)}`}
            className={cn(
              'touch-target relative inline-flex items-center justify-center text-bone/80 transition-colors hover:text-brass',
              hideMobileCart && 'lg:inline-flex max-lg:hidden',
            )}
            key={lastAddedAt || 'cart'}
            animate={lastAddedAt ? { scale: [1, 1.12, 1] } : undefined}
            transition={{ duration: 0.35 }}
          >
            <ShoppingBag size={20} strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className="absolute top-2 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brass px-1 font-display text-[0.6rem] font-bold text-ink">
                {itemCount}
              </span>
            )}
          </motion.button>
        </div>
      </div>
    </header>
  )
}
