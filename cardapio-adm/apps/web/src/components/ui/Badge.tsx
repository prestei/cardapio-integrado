import { cn } from '@/utils/cn'

type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'muted'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-elevated text-text border border-border',
  accent: 'bg-accent-muted text-accent',
  success: 'bg-success/15 text-success',
  warning: 'bg-accent-muted text-accent',
  danger: 'bg-danger/15 text-danger',
  muted: 'bg-elevated text-muted',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[var(--radius-sm)] px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
