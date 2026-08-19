import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { establishmentService } from '@/services/establishment'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'

interface StoreOpenStatusProps {
  toggleable?: boolean
  className?: string
}

export function StoreOpenStatus({ toggleable = false, className }: StoreOpenStatusProps) {
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient()

  const { data: establishment } = useQuery({
    queryKey: ['establishment'],
    queryFn: establishmentService.get,
    enabled: !!user,
  })

  const isOpen = establishment?.isOpen ?? user?.establishment?.isOpen ?? false

  const mutation = useMutation({
    mutationFn: (next: boolean) => establishmentService.update({ isOpen: next }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['establishment'] })
      await refreshUser()
    },
  })

  const badge = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm',
        isOpen ? 'bg-emerald-950/70 text-emerald-400' : 'bg-[#3a1518] text-[#f07178]',
        toggleable && 'transition-opacity hover:opacity-90',
        mutation.isPending && 'opacity-60',
        className,
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          isOpen ? 'animate-pulse bg-emerald-400' : 'bg-[#f07178]',
        )}
        aria-hidden="true"
      />
      {isOpen ? 'Aberto' : 'Fechado'}
    </span>
  )

  if (!toggleable) {
    return badge
  }

  return (
    <button
      type="button"
      onClick={() => mutation.mutate(!isOpen)}
      disabled={mutation.isPending}
      className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      title={isOpen ? 'Clique para fechar a loja' : 'Clique para abrir a loja'}
      aria-label={isOpen ? 'Loja aberta. Clique para fechar.' : 'Loja fechada. Clique para abrir.'}
    >
      {badge}
    </button>
  )
}
