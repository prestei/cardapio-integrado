import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChefHat,
  Maximize,
  Minimize,
  Clock,
  RefreshCw,
  Sparkles,
  Flame,
  AlertTriangle,
  ArrowRight,
  Truck,
  Store,
  UtensilsCrossed,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { kdsService, subscribeKdsEvents } from '@/services/kds'
import { ordersService } from '@/services/orders'
import type { Order, OrderStatus, OrderType } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { orderTypeLabels, orderStatusLabels, orderStatusColors } from '@/utils/format'
import { cn } from '@/utils/cn'

const KITCHEN_STATUSES: OrderStatus[] = ['NEW', 'CONFIRMED', 'PREPARING']
const DELAY_THRESHOLD_MINUTES = 15

const NEXT_ACTION: Partial<Record<OrderStatus, { label: string; next: OrderStatus }>> = {
  NEW: { label: 'Confirmar', next: 'CONFIRMED' },
  CONFIRMED: { label: 'Preparar', next: 'PREPARING' },
  PREPARING: { label: 'Pronto', next: 'READY' },
}

const ORDER_TYPE_ICONS: Record<OrderType, LucideIcon> = {
  DELIVERY: Truck,
  PICKUP: Store,
  DINE_IN: UtensilsCrossed,
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'accent',
}: {
  label: string
  value: string
  icon: LucideIcon
  tone?: 'accent' | 'gold' | 'danger' | 'success'
}) {
  const tones = {
    accent: 'bg-accent-muted text-accent',
    gold: 'bg-gold-muted text-gold',
    danger: 'bg-danger/15 text-danger',
    success: 'bg-success/15 text-success',
  }

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 transition-colors hover:border-accent/25">
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)]',
          tones[tone],
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="truncate font-display text-xl font-semibold text-text">{value}</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  )
}

function useElapsedMinutes(createdAt: string) {
  const [minutes, setMinutes] = useState(() =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000),
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setMinutes(Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000))
    }, 15_000)
    return () => clearInterval(interval)
  }, [createdAt])

  return minutes
}

function OrderCard({
  order,
  onAdvance,
  isAdvancing,
}: {
  order: Order
  onAdvance: (id: string, status: OrderStatus) => void
  isAdvancing: boolean
}) {
  const minutes = useElapsedMinutes(order.createdAt)
  const isDelayed = minutes >= DELAY_THRESHOLD_MINUTES
  const action = NEXT_ACTION[order.status]
  const statusColor = orderStatusColors[order.status]
  const TypeIcon = ORDER_TYPE_ICONS[order.type]

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border-2 bg-surface transition-all hover:-translate-y-0.5 hover:shadow-lg',
        isDelayed ? 'border-danger shadow-[0_0_24px_rgba(244,63,94,0.15)]' : 'border-border hover:border-accent/30',
      )}
    >
      <div
        className="h-1 w-full"
        style={{ backgroundColor: statusColor }}
        aria-hidden="true"
      />

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="font-display text-2xl font-bold text-text">#{order.code}</span>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <StatusBadge status={order.status} size="sm" />
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <TypeIcon className="h-3.5 w-3.5 text-accent/80" aria-hidden="true" />
                {orderTypeLabels[order.type]}
              </span>
            </div>
          </div>
          <span
            className={cn(
              'flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] px-2.5 py-1 text-sm font-semibold',
              isDelayed ? 'bg-danger/15 text-danger' : 'bg-elevated text-muted',
            )}
          >
            <Clock className="h-4 w-4" />
            {minutes}min
          </span>
        </div>

        {order.customer?.name && (
          <p className="mt-2 text-sm font-medium text-text">{order.customer.name}</p>
        )}

        {order.items && order.items.length > 0 && (
          <ul className="mt-3 flex-1 space-y-2 border-t border-border pt-3">
            {order.items.map((item) => (
              <li key={item.id} className="text-base text-text">
                <span className="font-semibold text-accent">{item.quantity}x</span> {item.name}
                {item.additionals && item.additionals.length > 0 && (
                  <span className="block text-sm text-muted">
                    + {item.additionals.map((a) => a.name).join(', ')}
                  </span>
                )}
                {item.notes && (
                  <span className="block text-sm italic text-muted">Obs: {item.notes}</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {order.notes && (
          <p className="mt-3 rounded-[var(--radius-sm)] border border-gold/20 bg-gold-muted px-2.5 py-1.5 text-sm italic text-gold">
            {order.notes}
          </p>
        )}

        {action && (
          <button
            type="button"
            disabled={isAdvancing}
            onClick={() => onAdvance(order.id, action.next)}
            className={cn(
              'mt-4 flex h-14 items-center justify-center rounded-[var(--radius-md)] text-lg font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-50',
              isDelayed ? 'bg-danger hover:bg-danger/90' : 'bg-accent hover:bg-accent-hover',
            )}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}

function KitchenColumn({
  status,
  orders,
  onAdvance,
  isAdvancing,
}: {
  status: OrderStatus
  orders: Order[]
  onAdvance: (id: string, status: OrderStatus) => void
  isAdvancing: boolean
}) {
  const color = orderStatusColors[status]

  return (
    <div className="flex min-w-[280px] flex-1 flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm">
      <div
        className="flex items-center justify-between border-b border-border px-4 py-3"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${color} 14%, transparent), transparent)`,
        }}
      >
        <StatusBadge status={status} size="sm" />
        <span
          className="flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-bold"
          style={{
            backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
            color,
          }}
        >
          {orders.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3" style={{ maxHeight: 'calc(100dvh - 320px)' }}>
        {orders.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
            <p className="text-sm font-medium text-muted">{orderStatusLabels[status]}</p>
            <p className="mt-1 text-xs text-muted/70">Nenhum pedido nesta etapa</p>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onAdvance={onAdvance}
              isAdvancing={isAdvancing}
            />
          ))
        )}
      </div>
    </div>
  )
}

export function KitchenPage() {
  const queryClient = useQueryClient()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: kdsOrders, error: kdsError } = useQuery({
    queryKey: ['kds-orders'],
    queryFn: kdsService.list,
    refetchInterval: 15_000,
    retry: 1,
  })

  const { data: fallbackOrders, isLoading: fallbackLoading } = useQuery({
    queryKey: ['orders', 'kitchen-fallback'],
    queryFn: () => ordersService.list({}),
    refetchInterval: 15_000,
    enabled: Boolean(kdsError),
  })

  const orders = (kdsError ? fallbackOrders : kdsOrders) ?? []
  const isLoading = kdsError ? fallbackLoading : !kdsOrders && !kdsError

  useEffect(() => {
    const unsubscribe = subscribeKdsEvents(() => {
      queryClient.invalidateQueries({ queryKey: ['kds-orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders', 'kitchen-fallback'] })
    })
    return unsubscribe
  }, [queryClient])

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void containerRef.current?.requestFullscreen()
    }
  }

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kds-orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const kitchenOrders = useMemo(
    () =>
      orders
        .filter((o) => KITCHEN_STATUSES.includes(o.status))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [orders],
  )

  const stats = useMemo(() => {
    const byStatus = {
      NEW: kitchenOrders.filter((o) => o.status === 'NEW').length,
      CONFIRMED: kitchenOrders.filter((o) => o.status === 'CONFIRMED').length,
      PREPARING: kitchenOrders.filter((o) => o.status === 'PREPARING').length,
    }
    const delayed = kitchenOrders.filter((o) => {
      const minutes = Math.floor((Date.now() - new Date(o.createdAt).getTime()) / 60000)
      return minutes >= DELAY_THRESHOLD_MINUTES
    }).length

    return { ...byStatus, delayed, total: kitchenOrders.length }
  }, [kitchenOrders])

  const handleAdvance = (id: string, status: OrderStatus) => {
    statusMutation.mutate({ id, status })
  }

  return (
    <div ref={containerRef} className={cn(isFullscreen && 'min-h-dvh bg-bg p-6')}>
      <PageHeader
        title="Cozinha"
        description="Painel de produção (KDS) — acompanhe e avance os pedidos"
        actions={
          <div className="flex items-center gap-2">
            <span className="mr-1 hidden items-center gap-1.5 text-xs text-muted sm:inline-flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              Ao vivo
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['kds-orders'] })
                queryClient.invalidateQueries({ queryKey: ['orders', 'kitchen-fallback'] })
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              {isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            </Button>
          </div>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Novos" value={String(stats.NEW)} icon={Sparkles} tone="accent" />
        <StatCard label="Confirmados" value={String(stats.CONFIRMED)} icon={ChefHat} tone="gold" />
        <StatCard label="Preparando" value={String(stats.PREPARING)} icon={Flame} tone="success" />
        <StatCard
          label="Atrasados (+15min)"
          value={String(stats.delayed)}
          icon={AlertTriangle}
          tone={stats.delayed > 0 ? 'danger' : 'accent'}
        />
      </div>

      {isLoading && (
        <div className="flex min-h-[300px] items-center justify-center rounded-[var(--radius-lg)] border border-border bg-surface">
          <Spinner size="lg" />
        </div>
      )}

      {!isLoading && kitchenOrders.length === 0 && (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          <div className="h-1.5 bg-gradient-to-r from-accent via-gold to-success" />
          <EmptyState
            icon={ChefHat}
            title="Cozinha tranquila por enquanto"
            description="Novos pedidos entram aqui automaticamente assim que forem feitos. Use tela cheia para operação no balcão."
          />
          <div className="-mt-4 pb-10 text-center">
            <Link
              to="/pedidos"
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              Ver todos os pedidos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {!isLoading && kitchenOrders.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {KITCHEN_STATUSES.map((status) => (
            <KitchenColumn
              key={status}
              status={status}
              orders={kitchenOrders.filter((o) => o.status === status)}
              onAdvance={handleAdvance}
              isAdvancing={statusMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
