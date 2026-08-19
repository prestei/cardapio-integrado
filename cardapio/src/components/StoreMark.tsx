import type { Store } from '@/types'
import { cn } from '@/utils'

interface StoreMarkProps {
  store: Pick<Store, 'name' | 'logoUrl'>
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE = {
  sm: 'h-8 w-8 text-[0.65rem]',
  md: 'h-[5.25rem] w-[5.25rem] text-xl',
  lg: 'h-28 w-28 text-3xl sm:h-32 sm:w-32',
} as const

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
}

export function StoreMark({ store, size = 'md', className }: StoreMarkProps) {
  const compact = size === 'sm'

  return (
    <div
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-full bg-ink-elevated',
        compact
          ? 'ring-1 ring-brass/45 ring-offset-1 ring-offset-ink'
          : 'ring-2 ring-brass/55 ring-offset-2 ring-offset-ink shadow-[0_12px_32px_rgb(0_0_0/0.45),0_0_28px_rgb(212_146_58/0.22)]',
        SIZE[size],
        className,
      )}
      aria-hidden={Boolean(store.logoUrl)}
    >
      {store.logoUrl ? (
        <img
          src={store.logoUrl}
          alt={store.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-display font-bold tracking-[0.12em] text-brass">
          {initials(store.name)}
        </span>
      )}
    </div>
  )
}
