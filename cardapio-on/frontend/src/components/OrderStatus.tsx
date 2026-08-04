import { motion } from 'motion/react'
import type { OrderStatus as Status } from '@/types'
import { cn } from '@/utils/cn'

const STEPS: Array<{ status: Status; label: string }> = [
  { status: 'NEW', label: 'Pedido recebido' },
  { status: 'CONFIRMED', label: 'Pedido confirmado' },
  { status: 'PREPARING', label: 'Em preparação' },
  { status: 'OUT_FOR_DELIVERY', label: 'Saiu para entrega' },
  { status: 'COMPLETED', label: 'Pedido entregue' },
]

const STATUS_INDEX: Record<Status, number> = {
  NEW: 0,
  CONFIRMED: 1,
  PREPARING: 2,
  READY: 2,
  OUT_FOR_DELIVERY: 3,
  COMPLETED: 4,
  CANCELLED: -1,
}

export function OrderStatusTimeline({
  status,
  isDelivery,
}: {
  status: Status
  isDelivery: boolean
}) {
  const steps = isDelivery
    ? STEPS
    : STEPS.map((step) =>
        step.status === 'OUT_FOR_DELIVERY'
          ? { ...step, label: 'Pronto para retirada' }
          : step.status === 'COMPLETED'
            ? { ...step, label: 'Pedido concluído' }
            : step,
      )

  if (status === 'CANCELLED') {
    return (
      <div className="rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
        Este pedido foi cancelado.
      </div>
    )
  }

  const activeIndex = STATUS_INDEX[status]

  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        const done = index <= activeIndex
        const current = index === activeIndex
        return (
          <li key={step.status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'grid h-3.5 w-3.5 place-items-center rounded-full border-2',
                  done
                    ? 'border-[var(--store-primary)] bg-[var(--store-primary)]'
                    : 'border-line-strong bg-canvas',
                )}
              />
              {index < steps.length - 1 ? (
                <span
                  className={cn(
                    'w-px flex-1 min-h-8',
                    index < activeIndex ? 'bg-[var(--store-primary)]' : 'bg-line',
                  )}
                />
              ) : null}
            </div>
            <div className="pb-6">
              <p
                className={cn(
                  'text-sm font-medium',
                  done ? 'text-ink' : 'text-muted',
                )}
              >
                {step.label}
              </p>
              {current ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-0.5 text-xs text-muted"
                >
                  Status atual
                </motion.p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
