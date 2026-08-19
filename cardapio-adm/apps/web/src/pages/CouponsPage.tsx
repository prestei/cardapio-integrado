import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Pencil,
  Trash2,
  Ticket,
  Archive,
  ArchiveRestore,
  Search,
  CheckCircle2,
  Percent,
  Truck,
  Calendar,
  Users,
  Power,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { couponsService } from '@/services/coupons'
import type { Coupon, CouponType } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/api'
import { formatCurrency, formatDate } from '@/utils/format'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/utils/cn'

const couponSchema = z
  .object({
    code: z
      .string()
      .min(2, 'Código obrigatório')
      .transform((v) => v.toUpperCase().trim()),
    description: z.string().optional(),
    type: z.enum(['PERCENTAGE', 'FIXED', 'FREE_DELIVERY']),
    value: z.coerce.number().min(0, 'Valor inválido'),
    minOrderValue: z.coerce.number().min(0).optional().nullable(),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    usageLimit: z.coerce.number().min(0).optional().nullable(),
    perCustomerLimit: z.coerce.number().min(0).optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => !data.startsAt || !data.endsAt || data.startsAt <= data.endsAt,
    { message: 'Data final deve ser após a inicial', path: ['endsAt'] },
  )

type CouponForm = z.infer<typeof couponSchema>

interface CouponPayload {
  code: string
  description?: string
  type: CouponType
  value: number
  isActive?: boolean
  minOrderValue: number | null
  usageLimit: number | null
  perCustomerLimit: number | null
  startsAt: string | null
  endsAt: string | null
}

type StatusFilter = 'all' | 'active' | 'scheduled' | 'expired' | 'archived'

const TYPE_OPTIONS: { value: CouponType; label: string }[] = [
  { value: 'PERCENTAGE', label: 'Percentual (%)' },
  { value: 'FIXED', label: 'Valor fixo (R$)' },
  { value: 'FREE_DELIVERY', label: 'Frete grátis' },
]

const couponTypeLabels: Record<CouponType, string> = {
  PERCENTAGE: 'Percentual',
  FIXED: 'Valor fixo',
  FREE_DELIVERY: 'Frete grátis',
}

const TYPE_META: Record<
  CouponType,
  { icon: LucideIcon; bar: string; wrap: string; text: string }
> = {
  PERCENTAGE: {
    icon: Percent,
    bar: 'bg-accent',
    wrap: 'bg-accent-muted text-accent',
    text: 'text-accent',
  },
  FIXED: {
    icon: Sparkles,
    bar: 'bg-gold',
    wrap: 'bg-gold-muted text-gold',
    text: 'text-gold',
  },
  FREE_DELIVERY: {
    icon: Truck,
    bar: 'bg-success',
    wrap: 'bg-success/15 text-success',
    text: 'text-success',
  },
}

function formatCouponValue(coupon: Coupon): string {
  if (coupon.type === 'PERCENTAGE') return `${coupon.value}%`
  if (coupon.type === 'FREE_DELIVERY') return 'Frete grátis'
  return formatCurrency(coupon.value)
}

function couponStatus(coupon: Coupon): {
  label: string
  variant: 'success' | 'muted' | 'warning' | 'danger'
} {
  if (coupon.isArchived) return { label: 'Arquivado', variant: 'muted' }
  if (!coupon.isActive) return { label: 'Inativo', variant: 'muted' }
  const now = new Date()
  if (coupon.endsAt && new Date(coupon.endsAt) < now) return { label: 'Expirado', variant: 'danger' }
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return { label: 'Agendado', variant: 'warning' }
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    return { label: 'Esgotado', variant: 'warning' }
  }
  return { label: 'Ativo', variant: 'success' }
}

function isActiveNow(coupon: Coupon) {
  const status = couponStatus(coupon)
  return status.label === 'Ativo'
}

function usageLabel(coupon: Coupon) {
  if (coupon.usageLimit != null) {
    return `${coupon.usageCount} / ${coupon.usageLimit} usos`
  }
  return `${coupon.usageCount} usos`
}

function CouponsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[4.5rem] w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
      <Skeleton className="h-12 w-full rounded-[var(--radius-lg)]" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    </div>
  )
}

export function CouponsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const debouncedSearch = useDebounce(search)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Coupon | null>(null)
  const queryClient = useQueryClient()

  const { data: coupons = [], isLoading, error } = useQuery({
    queryKey: ['coupons'],
    queryFn: couponsService.list,
  })

  const filteredCoupons = coupons.filter((coupon) => {
    const q = debouncedSearch.toLowerCase()
    const matchesSearch =
      coupon.code.toLowerCase().includes(q) ||
      (coupon.description ?? '').toLowerCase().includes(q)
    if (!matchesSearch) return false

    const status = couponStatus(coupon).label
    if (statusFilter === 'active') return status === 'Ativo'
    if (statusFilter === 'scheduled') return status === 'Agendado'
    if (statusFilter === 'expired') return status === 'Expirado' || status === 'Esgotado'
    if (statusFilter === 'archived') return coupon.isArchived
    if (statusFilter === 'all') return !coupon.isArchived
    return true
  })

  const nonArchived = coupons.filter((c) => !c.isArchived)
  const activeCount = nonArchived.filter(isActiveNow).length
  const totalUses = coupons.reduce((sum, c) => sum + c.usageCount, 0)
  const archivedCount = coupons.filter((c) => c.isArchived).length

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CouponForm>({
    resolver: zodResolver(couponSchema),
    defaultValues: { type: 'PERCENTAGE', value: 0, isActive: true },
  })

  const createMutation = useMutation({
    mutationFn: couponsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CouponPayload }) =>
      couponsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: couponsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      setDeleteConfirm(null)
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      couponsService.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  })

  const archiveMutation = useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
      couponsService.setArchived(id, isArchived),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coupons'] }),
  })

  const openCreate = () => {
    setEditing(null)
    reset({
      code: '',
      description: '',
      type: 'PERCENTAGE',
      value: 0,
      minOrderValue: undefined,
      startsAt: '',
      endsAt: '',
      usageLimit: undefined,
      perCustomerLimit: undefined,
      isActive: true,
    })
    setModalOpen(true)
  }

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon)
    reset({
      code: coupon.code,
      description: coupon.description || '',
      type: coupon.type,
      value: coupon.value,
      minOrderValue: coupon.minOrderValue,
      startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 10) : '',
      endsAt: coupon.endsAt ? coupon.endsAt.slice(0, 10) : '',
      usageLimit: coupon.usageLimit,
      perCustomerLimit: coupon.perCustomerLimit,
      isActive: coupon.isActive,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    reset()
  }

  const onSubmit = async (data: CouponForm) => {
    try {
      const payload = {
        code: data.code,
        description: data.description,
        type: data.type,
        value: data.value,
        isActive: data.isActive,
        minOrderValue: data.minOrderValue || null,
        usageLimit: data.usageLimit || null,
        perCustomerLimit: data.perCustomerLimit || null,
        startsAt: data.startsAt ? new Date(data.startsAt).toISOString() : null,
        endsAt: data.endsAt ? new Date(data.endsAt).toISOString() : null,
      }
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erro ao salvar'
      setError('root', { message })
    }
  }

  const filters: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'active', label: 'Ativos' },
    { id: 'scheduled', label: 'Agendados' },
    { id: 'expired', label: 'Expirados' },
    { id: 'archived', label: 'Arquivados' },
  ]

  return (
    <div>
      <PageHeader
        title="Cupons"
        description="Descontos e frete grátis para atrair clientes — BEMVINDO10, FDS20 e campanhas sazonais."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo cupom
          </Button>
        }
      />

      {isLoading && <CouponsSkeleton />}

      {error && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center text-danger">
          Erro ao carregar cupons
        </div>
      )}

      {!isLoading && !error && coupons.length === 0 && (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          <div className="h-1.5 bg-gradient-to-r from-accent via-gold to-success" />
          <EmptyState
            icon={Ticket}
            title="Crie seu primeiro cupom"
            description="Ofereça desconto percentual, valor fixo ou frete grátis. Defina validade e limite de usos para controlar a campanha."
            action={{ label: 'Novo cupom', onClick: openCreate }}
          />
        </div>
      )}

      {!isLoading && coupons.length > 0 && (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-accent-muted">
                <Ticket className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-text">{nonArchived.length}</p>
                <p className="text-sm text-muted">Cupons visíveis</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-success/15">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-text">{activeCount}</p>
                <p className="text-sm text-muted">Ativos agora</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-gold-muted">
                <Users className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-text">{totalUses}</p>
                <p className="text-sm text-muted">Usos totais</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-elevated">
                <Archive className="h-5 w-5 text-muted" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-text">{archivedCount}</p>
                <p className="text-sm text-muted">Arquivados</p>
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                placeholder="Buscar por código ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-elevated pr-3 pl-9 text-sm text-text placeholder:text-muted/60 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                aria-label="Buscar cupons"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setStatusFilter(filter.id)}
                  className={cn(
                    'h-9 rounded-full px-3 text-sm font-medium transition-colors',
                    statusFilter === filter.id
                      ? 'bg-accent text-white'
                      : 'bg-elevated text-muted hover:text-text',
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {filteredCoupons.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
              <EmptyState
                icon={Search}
                title="Nenhum cupom neste filtro"
                description="Tente outro termo ou mude o filtro para ver mais cupons."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCoupons.map((coupon) => {
                const status = couponStatus(coupon)
                const meta = TYPE_META[coupon.type]
                const Icon = meta.icon
                const usagePercent =
                  coupon.usageLimit != null && coupon.usageLimit > 0
                    ? Math.min(100, (coupon.usageCount / coupon.usageLimit) * 100)
                    : null

                return (
                  <div
                    key={coupon.id}
                    className={cn(
                      'relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface',
                      'transition-colors duration-150 hover:border-accent/35 hover:bg-elevated/40',
                      (coupon.isArchived || !coupon.isActive) && 'opacity-75',
                    )}
                  >
                    <span className={cn('absolute inset-y-0 left-0 w-1', meta.bar)} aria-hidden="true" />

                    <div className="flex flex-col gap-4 p-4 pl-5 sm:flex-row sm:items-center sm:gap-4">
                      <div
                        className={cn(
                          'flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-[var(--radius-md)]',
                          meta.wrap,
                        )}
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
                        <span className={cn('mt-0.5 font-display text-xs font-bold', meta.text)}>
                          {formatCouponValue(coupon)}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-mono text-base font-semibold tracking-[0.12em] text-text sm:text-lg">
                            {coupon.code}
                          </h3>
                          <Badge variant={status.variant}>{status.label}</Badge>
                          <Badge variant="default">{couponTypeLabels[coupon.type]}</Badge>
                        </div>

                        {coupon.description ? (
                          <p className="mt-1 line-clamp-1 text-sm text-muted">{coupon.description}</p>
                        ) : (
                          <p className="mt-1 text-sm text-muted/60 italic">Sem descrição</p>
                        )}

                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          {coupon.minOrderValue != null && coupon.minOrderValue > 0 && (
                            <span className="inline-flex items-center rounded-full bg-elevated px-2.5 py-1 text-xs text-muted">
                              Pedido mín. {formatCurrency(coupon.minOrderValue)}
                            </span>
                          )}
                          {(coupon.startsAt || coupon.endsAt) && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-elevated px-2.5 py-1 text-xs text-muted">
                              <Calendar className="h-3.5 w-3.5" />
                              {coupon.startsAt ? formatDate(coupon.startsAt) : '—'} →{' '}
                              {coupon.endsAt ? formatDate(coupon.endsAt) : '—'}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-elevated px-2.5 py-1 text-xs text-muted">
                            <Users className="h-3.5 w-3.5" />
                            {usageLabel(coupon)}
                          </span>
                          {coupon.perCustomerLimit != null && (
                            <span className="inline-flex items-center rounded-full bg-elevated px-2.5 py-1 text-xs text-muted">
                              máx. {coupon.perCustomerLimit}/cliente
                            </span>
                          )}
                        </div>

                        {usagePercent != null && (
                          <div className="mt-2.5 max-w-xs">
                            <div className="mb-1 flex justify-between text-[10px] text-muted">
                              <span>Uso da campanha</span>
                              <span>{Math.round(usagePercent)}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
                              <div
                                className={cn('h-full rounded-full transition-all', meta.bar)}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2 self-end sm:self-center">
                        {!coupon.isArchived && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                id: coupon.id,
                                isActive: !coupon.isActive,
                              })
                            }
                          >
                            <Power className="h-4 w-4" />
                            {coupon.isActive ? 'Desativar' : 'Ativar'}
                          </Button>
                        )}
                        <div className="flex items-center gap-0.5 rounded-[var(--radius-md)] bg-elevated/80 p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(coupon)}
                            aria-label="Editar"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              archiveMutation.mutate({
                                id: coupon.id,
                                isArchived: !coupon.isArchived,
                              })
                            }
                            aria-label={coupon.isArchived ? 'Restaurar' : 'Arquivar'}
                            title={coupon.isArchived ? 'Restaurar' : 'Arquivar'}
                          >
                            {coupon.isArchived ? (
                              <ArchiveRestore className="h-4 w-4" />
                            ) : (
                              <Archive className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirm(coupon)}
                            aria-label="Excluir"
                            title="Excluir"
                            className="text-danger hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar cupom' : 'Novo cupom'}
        description="O código é o que o cliente digita no checkout — use letras maiúsculas e números."
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Código"
              placeholder="EX: BEMVINDO10"
              error={errors.code?.message}
              {...register('code')}
            />
            <Select
              label="Tipo"
              options={TYPE_OPTIONS}
              error={errors.type?.message}
              {...register('type')}
            />
          </div>
          <Textarea label="Descrição" {...register('description')} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Valor"
              type="number"
              step="0.01"
              hint="Percentual ou valor fixo, conforme o tipo"
              error={errors.value?.message}
              {...register('value')}
            />
            <Input
              label="Pedido mínimo (R$)"
              type="number"
              step="0.01"
              {...register('minOrderValue')}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Início"
              type="date"
              error={errors.startsAt?.message}
              {...register('startsAt')}
            />
            <Input
              label="Fim"
              type="date"
              error={errors.endsAt?.message}
              {...register('endsAt')}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Limite total de usos"
              type="number"
              min={0}
              hint="Deixe vazio para ilimitado"
              {...register('usageLimit')}
            />
            <Input
              label="Limite por cliente"
              type="number"
              min={0}
              hint="Deixe vazio para ilimitado"
              {...register('perCustomerLimit')}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" {...register('isActive')} className="rounded border-border" />
            Cupom ativo
          </label>
          {errors.root && <p className="text-sm text-danger">{errors.root.message}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editing ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Excluir cupom"
        size="sm"
      >
        <p className="text-sm text-muted">
          Excluir o cupom <strong className="text-text">{deleteConfirm?.code}</strong>? Esta ação
          não pode ser desfeita.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button
            variant="danger"
            isLoading={deleteMutation.isPending}
            onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
          >
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  )
}
