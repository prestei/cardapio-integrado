import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Ticket, Archive, ArchiveRestore } from 'lucide-react'
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
import { TableSkeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/api'
import { formatCurrency, formatDate } from '@/utils/format'

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

function formatCouponValue(coupon: Coupon): string {
  if (coupon.type === 'PERCENTAGE') return `${coupon.value}%`
  if (coupon.type === 'FREE_DELIVERY') return 'Frete grátis'
  return formatCurrency(coupon.value)
}

function couponStatus(coupon: Coupon): { label: string; variant: 'success' | 'muted' | 'warning' | 'danger' } {
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

export function CouponsPage() {
  const [showArchived, setShowArchived] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Coupon | null>(null)
  const queryClient = useQueryClient()

  const { data: coupons = [], isLoading, error } = useQuery({
    queryKey: ['coupons'],
    queryFn: couponsService.list,
  })

  const visibleCoupons = coupons.filter((c) => showArchived || !c.isArchived)

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

  return (
    <div>
      <PageHeader
        title="Cupons"
        description="Crie e gerencie cupons de desconto"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo cupom
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-border"
          />
          Mostrar arquivados
        </label>
      </div>

      {isLoading && <TableSkeleton rows={5} />}

      {error && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center text-danger">
          Erro ao carregar cupons
        </div>
      )}

      {!isLoading && !error && visibleCoupons.length === 0 && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
          <EmptyState
            icon={Ticket}
            title="Nenhum cupom"
            description="Crie cupons de desconto para atrair e fidelizar clientes."
            action={{ label: 'Novo cupom', onClick: openCreate }}
          />
        </div>
      )}

      {!isLoading && visibleCoupons.length > 0 && (
        <div className="space-y-2">
          {visibleCoupons.map((coupon) => {
            const status = couponStatus(coupon)
            return (
              <div
                key={coupon.id}
                className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-mono font-semibold tracking-wide text-text">
                      {coupon.code}
                    </h3>
                    <Badge variant={status.variant}>{status.label}</Badge>
                    <Badge variant="accent">{couponTypeLabels[coupon.type]}</Badge>
                  </div>
                  {coupon.description && (
                    <p className="mt-0.5 truncate text-sm text-muted">{coupon.description}</p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
                    <span className="font-medium text-accent">{formatCouponValue(coupon)}</span>
                    {coupon.minOrderValue != null && (
                      <span>Pedido mín. {formatCurrency(coupon.minOrderValue)}</span>
                    )}
                    {(coupon.startsAt || coupon.endsAt) && (
                      <span>
                        {coupon.startsAt ? formatDate(coupon.startsAt) : '—'} até{' '}
                        {coupon.endsAt ? formatDate(coupon.endsAt) : '—'}
                      </span>
                    )}
                    <span>
                      Usado {coupon.usageCount}
                      {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}×
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {!coupon.isArchived && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        toggleActiveMutation.mutate({ id: coupon.id, isActive: !coupon.isActive })
                      }
                    >
                      {coupon.isActive ? 'Desativar' : 'Ativar'}
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openEdit(coupon)} aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      archiveMutation.mutate({ id: coupon.id, isArchived: !coupon.isArchived })
                    }
                    aria-label={coupon.isArchived ? 'Restaurar' : 'Arquivar'}
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
                    className="text-danger hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar cupom' : 'Novo cupom'}
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
