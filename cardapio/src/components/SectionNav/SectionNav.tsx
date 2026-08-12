import { motion, AnimatePresence } from 'motion/react'
import { Home, Star, UtensilsCrossed, Tag } from 'lucide-react'
import type { SectionId } from '@/types'
import { useCart } from '@/context/CartContext'
import { cn, formatCurrency } from '@/utils'
import { scrollToSection } from '@/hooks/useSectionObserver'

const ITEMS: { id: SectionId; label: string; Icon: typeof Home }[] = [
  { id: 'loja', label: 'Loja', Icon: Home },
  { id: 'favoritos', label: 'Favoritos', Icon: Star },
  { id: 'cardapio', label: 'Cardápio', Icon: UtensilsCrossed },
  { id: 'promocoes', label: 'Ofertas', Icon: Tag },
]

interface SectionNavProps {
  active: string
}

export function SectionNav({ active }: SectionNavProps) {
  const { itemCount, subtotal, openCart, isOpen, lastAddedAt } = useCart()
  const hasCart = itemCount > 0

  return (
    <>
      {/* Desktop side rail */}
      <nav
        aria-label="Seções do cardápio"
        className="fixed top-1/2 right-5 z-30 hidden -translate-y-1/2 flex-col gap-5 lg:flex"
      >
        {ITEMS.map((item) => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToSection(item.id)}
              className="group flex items-center justify-end gap-3"
              aria-current={isActive ? 'true' : undefined}
            >
              <span
                className={cn(
                  'text-[0.65rem] tracking-[0.22em] uppercase transition-all duration-300',
                  isActive
                    ? 'translate-x-0 opacity-100 text-brass'
                    : 'translate-x-2 opacity-0 text-bone/60 group-hover:translate-x-0 group-hover:opacity-100',
                )}
              >
                {item.label}
              </span>
              <span
                className={cn(
                  'block h-px transition-all duration-500',
                  isActive ? 'w-8 bg-brass' : 'w-3 bg-bone/30 group-hover:w-5 group-hover:bg-bone/60',
                )}
              />
            </button>
          )
        })}
      </nav>

      {/* Desktop floating cart pill */}
      <AnimatePresence>
        {hasCart && !isOpen && (
          <motion.button
            type="button"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            key={lastAddedAt || 'desk-cart'}
            onClick={openCart}
            className="fixed right-6 bottom-6 z-40 hidden items-center gap-4 border border-line bg-ink/95 px-4 py-3 backdrop-blur-md lg:flex"
          >
            <span className="text-left">
              <span className="block font-display text-sm text-bone">
                {itemCount} {itemCount === 1 ? 'item' : 'itens'}
              </span>
              <span className="text-brass">{formatCurrency(subtotal)}</span>
            </span>
            <span className="font-display text-[0.65rem] tracking-[0.2em] text-brass uppercase">
              Ver
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile unified dock */}
      <div
        data-dock-cart={hasCart && !isOpen ? 'true' : 'false'}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line/50 bg-ink/92 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'var(--safe-bottom)' }}
      >
        <AnimatePresence initial={false}>
          {hasCart && !isOpen && (
            <motion.button
              type="button"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              onClick={openCart}
              className="flex w-full items-center justify-between gap-3 overflow-hidden border-b border-line/40 bg-brass px-4 text-ink"
              style={{ minHeight: '3.25rem' }}
              aria-label={`Ver pedido, ${itemCount} itens, ${formatCurrency(subtotal)}`}
            >
              <span className="font-display text-sm tracking-wide">
                {itemCount} {itemCount === 1 ? 'item' : 'itens'} · {formatCurrency(subtotal)}
              </span>
              <span className="font-display text-[0.65rem] tracking-[0.2em] uppercase">
                Ver pedido
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        <nav aria-label="Navegação rápida" className="px-1 pt-1">
          <ul className="mx-auto flex max-w-lg items-stretch justify-between">
            {ITEMS.map((item) => {
              const isActive = active === item.id
              const { Icon } = item
              return (
                <li key={item.id} className="flex-1">
                  <button
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className="relative flex w-full flex-col items-center gap-0.5 py-2.5"
                    aria-current={isActive ? 'true' : undefined}
                    style={{ minHeight: 'var(--nav-h)' }}
                  >
                    <Icon
                      size={18}
                      strokeWidth={1.5}
                      className={cn(
                        'transition-colors',
                        isActive ? 'text-brass' : 'text-bone/40',
                      )}
                    />
                    <span
                      className={cn(
                        'font-display text-[0.6rem] tracking-[0.1em] uppercase transition-colors',
                        isActive ? 'text-brass' : 'text-bone/40',
                      )}
                    >
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.span
                        layoutId="mobile-nav-indicator"
                        className="absolute bottom-1 h-px w-5 bg-brass"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </>
  )
}
