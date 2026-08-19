import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-hover font-medium shadow-sm active:scale-[0.98]',
  secondary:
    'bg-elevated text-text border border-border hover:bg-surface active:scale-[0.98]',
  ghost: 'text-muted hover:text-text hover:bg-elevated active:scale-[0.98]',
  danger: 'bg-danger/15 text-danger hover:bg-danger/25 active:scale-[0.98]',
  outline:
    'border border-border text-text hover:border-accent hover:text-accent active:scale-[0.98]',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm rounded-[var(--radius-sm)]',
  md: 'h-10 px-4 text-sm rounded-[var(--radius-md)]',
  lg: 'h-11 px-6 text-base rounded-[var(--radius-md)]',
  icon: 'h-9 w-9 rounded-[var(--radius-md)]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading,
      disabled,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Carregando...</span>
        </>
      ) : (
        children
      )}
    </button>
  ),
)

Button.displayName = 'Button'
