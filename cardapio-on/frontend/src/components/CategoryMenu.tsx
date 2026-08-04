import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import type { NavCategory } from '@/hooks/useCategories'
import { cn } from '@/utils/cn'

interface CategoryMenuProps {
  categories: NavCategory[]
  activeId: string
  onSelect: (id: string) => void
}

export function CategoryMenu({
  categories,
  activeId,
  onSelect,
}: CategoryMenuProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [activeId])

  return (
    <div className="sticky top-14 z-30 border-b border-line bg-canvas/95 backdrop-blur-md sm:top-16">
      <div
        ref={scrollerRef}
        className="scrollbar-none mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-3 sm:px-6"
        role="tablist"
        aria-label="Categorias do cardápio"
      >
        {categories.map((category) => {
          const active = category.id === activeId
          return (
            <button
              key={category.id}
              ref={active ? activeRef : undefined}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(category.id)}
              className={cn(
                'relative shrink-0 rounded-[var(--radius-md)] px-3.5 py-2 text-sm font-medium transition',
                active ? 'text-ink' : 'text-muted hover:text-ink-soft',
              )}
            >
              {active && (
                <motion.span
                  layoutId="category-indicator"
                  className="absolute inset-0 rounded-[var(--radius-md)]"
                  style={{ background: 'rgb(242 169 74 / 0.16)' }}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span
                className="relative z-10"
                style={active ? { color: 'var(--store-primary)' } : undefined}
              >
                {category.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
