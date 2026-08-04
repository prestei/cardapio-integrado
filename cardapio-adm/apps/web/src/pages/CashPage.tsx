import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Wallet,
  Lock,
  Unlock,
  Plus,
  Minus,
  History,
  ArrowUpCircle,
  ArrowDownCircle,
  Settings2,
} from 'lucide-react'
import { cashService } from '@/services/cash'
import type { CashMovementType, CashRegister } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { ApiError } from '@/services/api'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { cn } from '@/utils/cn'

const MOVEMENT_TYPE_OPTIONS: { value: CashMovementType; label: string }[] = [
  { value: 'INCOME', label: 'Entrada' },
  { value: 'OUTCOME', label: 'Saída' },
  { value: 'BLEED', label: 'Sangria' },
  { value: 'ADJUSTMENT', label: 'Ajuste' },
]

const movementTypeLabels: Record<CashMovementType, string> = {
  SALE: 'Venda',
  INCOME: 'Entrada',
  OUTCOME: 'Saída',
  BLEED: 'Sangria',
  ADJUSTMENT: 'Ajuste',
  REFUND: 'Estorno',
}

const OUTFLOW: CashMovementType[] = ['OUTCOME', 'BLEED', 'REFUND']

function movementSign(type: CashMovementType) {
  return OUTFLOW.includes(type) ? -1 : 1
}

export function CashPage() {
  const [tab, setTab] = useState<'atual' | 'historico'>('atual')

  return (
    <div>
      <PageHeader title="Caixa" description="Abertura, fechamento e movimentações do caixa" />

      <div
        role="tablist"
        aria-label="Seções do caixa"
        className="mb-6 flex flex-wrap gap-1 rounded-[var(--radius-md)] border border-border bg-surface p-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'atual'}
          onClick={() => setTab('atual')}
          className={cn(
            'flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            tab === 'atual' ? 'bg-accent-muted text-accent font-medium' : 'text-muted hover:text-text',
          )}
        >
          <Wallet className="h-4 w-4" aria-hidden />
          Caixa atual
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'historico'}
          onClick={() => setTab('historico')}
          className={cn(
            'flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            tab === 'historico' ? 'bg-accent-muted text-accent font-medium' : 'text-muted hover:text-text',
          )}
        >
          <History className="h-4 w-4" aria-hidden />
          Histórico
        </button>
      </div>

      {tab === 'atual' ? <CurrentCashTab /> : <CashHistoryTab />}
    </div>
  )
}

const openSchema = z.object({
  openingAmount: z.coerce.number().min(0, 'Valor inválido'),
  note: z.string().optional(),
})
type OpenForm = z.infer<typeof openSchema>

const closeSchema = z.object({
  closingAmount: z.coerce.number().min(0, 'Valor inválido'),
  note: z.string().optional(),
})
type CloseForm = z.infer<typeof closeSchema>

const movementSchema = z.object({
  type: z.enum(['INCOME', 'OUTCOME', 'BLEED', 'ADJUSTMENT']),
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  reason: z.string().optional(),
})
type MovementForm = z.infer<typeof movementSchema>

function CurrentCashTab() {
  const queryClient = useQueryClient()
  const [openModal, setOpenModal] = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [movementModal, setMovementModal] = useState(false)

  const { data: register, isLoading, error, refetch } = useQuery({
    queryKey: ['cash-current'],
    queryFn: cashService.getCurrent,
  })

  const openForm = useForm<OpenForm>({
    resolver: zodResolver(openSchema),
    defaultValues: { openingAmount: 0, note: '' },
  })

  const closeForm = useForm<CloseForm>({
    resolver: zodResolver(closeSchema),
    defaultValues: { closingAmount: 0, note: '' },
  })

  const movementForm = useForm<MovementForm>({
    resolver: zodResolver(movementSchema),
    defaultValues: { type: 'INCOME', amount: 0, reason: '' },
  })

  const openMutation = useMutation({
    mutationFn: (data: OpenForm) =>
      cashService.open({ openingAmount: data.openingAmount, note: data.note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-current'] })
      setOpenModal(false)
      openForm.reset()
    },
  })

  const closeMutation = useMutation({
    mutationFn: (data: CloseForm) =>
      cashService.close(register!.id, {
        closingAmount: data.closingAmount,
        note: data.note,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-current'] })
      queryClient.invalidateQueries({ queryKey: ['cash-history'] })
      setCloseModal(false)
      closeForm.reset()
    },
  })

  const movementMutation = useMutation({
    mutationFn: (data: MovementForm) =>
      cashService.addMovement(register!.id, {
        type: data.type,
        amount: data.amount,
        reason: data.reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-current'] })
      setMovementModal(false)
      movementForm.reset({ type: 'INCOME', amount: 0, reason: '' })
    },
  })

  const onOpen = async (data: OpenForm) => {
    try {
      await openMutation.mutateAsync(data)
    } catch (err) {
      openForm.setError('root', { message: err instanceof ApiError ? err.message : 'Erro ao abrir caixa' })
    }
  }

  const onClose = async (data: CloseForm) => {
    try {
      await closeMutation.mutateAsync(data)
    } catch (err) {
      closeForm.setError('root', { message: err instanceof ApiError ? err.message : 'Erro ao fechar caixa' })
    }
  }

  const onMovement = async (data: MovementForm) => {
    try {
      await movementMutation.mutateAsync(data)
    } catch (err) {
      movementForm.setError('root', {
        message: err instanceof ApiError ? err.message : 'Erro ao registrar movimento',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center" role="status" aria-live="polite">
        <Spinner size="lg" />
        <span className="sr-only">Carregando caixa</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center" role="alert">
        <p className="text-danger">Erro ao carregar o caixa.</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  const isOpen = register?.status === 'OPEN'

  if (!register || !isOpen) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
        <EmptyState
          icon={Unlock}
          title="Caixa fechado"
          description="Abra o caixa para registrar vendas e movimentações do dia."
          action={{ label: 'Abrir caixa', onClick: () => setOpenModal(true) }}
        />

        <Modal open={openModal} onClose={() => setOpenModal(false)} title="Abrir caixa" size="sm">
          <form onSubmit={openForm.handleSubmit(onOpen)} className="space-y-4">
            <Input
              label="Valor de abertura (R$)"
              type="number"
              step="0.01"
              autoFocus
              error={openForm.formState.errors.openingAmount?.message}
              {...openForm.register('openingAmount')}
            />
            <Textarea label="Observações" {...openForm.register('note')} />
            {openForm.formState.errors.root && (
              <p className="text-sm text-danger" role="alert">
                {openForm.formState.errors.root.message}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpenModal(false)}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={openForm.formState.isSubmitting}>
                Abrir caixa
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    )
  }

  const totalMovements = (register.movements ?? []).reduce(
    (sum, m) => sum + movementSign(m.type) * Number(m.amount),
    0,
  )
  const expected =
    register.expectedAmount ?? Number(register.openingAmount) + totalMovements

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Aberto desde" value={formatDateTime(register.openedAt)} icon={Unlock} />
        <SummaryCard
          label="Valor de abertura"
          value={formatCurrency(Number(register.openingAmount))}
          icon={Wallet}
        />
        <SummaryCard label="Saldo esperado" value={formatCurrency(expected)} icon={ArrowUpCircle} />
        <SummaryCard label="Responsável" value={register.openedBy?.name || '—'} icon={Settings2} />
      </div>

      <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-sm font-medium text-text">Movimentações</h3>
          <Button size="sm" onClick={() => setMovementModal(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Novo movimento
          </Button>
        </div>
        {(register.movements ?? []).length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">Nenhuma movimentação registrada ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {register.movements!.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  {movementSign(m.type) > 0 ? (
                    <ArrowUpCircle className="h-5 w-5 shrink-0 text-success" aria-hidden />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 shrink-0 text-danger" aria-hidden />
                  )}
                  <div>
                    <p className="text-sm text-text">{movementTypeLabels[m.type]}</p>
                    {m.reason && <p className="text-xs text-muted">{m.reason}</p>}
                    <p className="text-xs text-muted">{formatDateTime(m.createdAt)}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    'font-medium',
                    movementSign(m.type) > 0 ? 'text-success' : 'text-danger',
                  )}
                >
                  {movementSign(m.type) > 0 ? '+' : '-'}
                  {formatCurrency(Number(m.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end">
        <Button variant="danger" onClick={() => setCloseModal(true)}>
          <Lock className="h-4 w-4" aria-hidden />
          Fechar caixa
        </Button>
      </div>

      <Modal open={movementModal} onClose={() => setMovementModal(false)} title="Novo movimento" size="sm">
        <form onSubmit={movementForm.handleSubmit(onMovement)} className="space-y-4">
          <Select
            label="Tipo"
            options={MOVEMENT_TYPE_OPTIONS}
            error={movementForm.formState.errors.type?.message}
            {...movementForm.register('type')}
          />
          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            error={movementForm.formState.errors.amount?.message}
            {...movementForm.register('amount')}
          />
          <Textarea label="Motivo" {...movementForm.register('reason')} />
          {movementForm.formState.errors.root && (
            <p className="text-sm text-danger" role="alert">
              {movementForm.formState.errors.root.message}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setMovementModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={movementForm.formState.isSubmitting}>
              <Minus className="h-4 w-4" aria-hidden />
              Registrar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={closeModal} onClose={() => setCloseModal(false)} title="Fechar caixa" size="sm">
        <form onSubmit={closeForm.handleSubmit(onClose)} className="space-y-4">
          <div className="rounded-[var(--radius-md)] border border-border bg-elevated p-3 text-sm">
            <div className="flex justify-between text-muted">
              <span>Saldo esperado</span>
              <span className="font-medium text-text">{formatCurrency(expected)}</span>
            </div>
          </div>
          <Input
            label="Valor contado no fechamento (R$)"
            type="number"
            step="0.01"
            autoFocus
            error={closeForm.formState.errors.closingAmount?.message}
            {...closeForm.register('closingAmount')}
          />
          <Textarea label="Observações" {...closeForm.register('note')} />
          {closeForm.formState.errors.root && (
            <p className="text-sm text-danger" role="alert">
              {closeForm.formState.errors.root.message}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCloseModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="danger" isLoading={closeForm.formState.isSubmitting}>
              Fechar caixa
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof Wallet
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 font-display text-lg font-semibold text-text">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-accent-muted">
          <Icon className="h-5 w-5 text-accent" aria-hidden />
        </div>
      </div>
    </div>
  )
}

function CashHistoryTab() {
  const [selected, setSelected] = useState<CashRegister | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['cash-history'],
    queryFn: () => cashService.history(),
  })

  const registers = data?.items ?? []

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center" role="status">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center text-danger" role="alert">
        Erro ao carregar histórico do caixa.
      </div>
    )
  }

  if (registers.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
        <EmptyState icon={History} title="Nenhum registro" description="O histórico de caixas aparecerá aqui." />
      </div>
    )
  }

  return (
    <>
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-elevated text-left text-muted">
              <th className="px-4 py-3 font-medium">Abertura</th>
              <th className="px-4 py-3 font-medium">Fechamento</th>
              <th className="px-4 py-3 font-medium">Responsável</th>
              <th className="px-4 py-3 font-medium text-right">Diferença</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {registers.map((r) => (
              <tr
                key={r.id}
                className="cursor-pointer border-b border-border/50 hover:bg-elevated/50 focus-within:bg-elevated/50"
                onClick={() => setSelected(r)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelected(r)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Detalhes do caixa aberto em ${formatDateTime(r.openedAt)}`}
              >
                <td className="px-4 py-3 text-text">{formatDateTime(r.openedAt)}</td>
                <td className="px-4 py-3 text-muted">
                  {r.closedAt ? formatDateTime(r.closedAt) : '—'}
                </td>
                <td className="px-4 py-3 text-muted">{r.openedBy?.name || '—'}</td>
                <td className="px-4 py-3 text-right text-text">
                  {r.difference != null ? formatCurrency(Number(r.difference)) : '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={r.status === 'OPEN' ? 'success' : 'muted'}>
                    {r.status === 'OPEN' ? 'Aberto' : 'Fechado'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalhes do caixa" size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">Abertura</p>
                <p className="text-sm text-text">
                  {formatDateTime(selected.openedAt)} — {formatCurrency(Number(selected.openingAmount))}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">Fechamento</p>
                <p className="text-sm text-text">
                  {selected.closedAt
                    ? `${formatDateTime(selected.closedAt)} — ${formatCurrency(Number(selected.closingAmount ?? 0))}`
                    : 'Em aberto'}
                </p>
              </div>
            </div>
            {selected.movements && selected.movements.length > 0 && (
              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-muted">Movimentações</p>
                <ul className="space-y-2">
                  {selected.movements.map((m) => (
                    <li key={m.id} className="flex justify-between text-sm">
                      <span className="text-muted">
                        {movementTypeLabels[m.type]} — {formatDateTime(m.createdAt)}
                      </span>
                      <span className={movementSign(m.type) > 0 ? 'text-success' : 'text-danger'}>
                        {movementSign(m.type) > 0 ? '+' : '-'}
                        {formatCurrency(Number(m.amount))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
