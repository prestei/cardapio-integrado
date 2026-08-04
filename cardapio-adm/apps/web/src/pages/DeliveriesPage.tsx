import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, MapPin, Truck, Search, CheckCircle2, Flag } from 'lucide-react'
import { deliveryZonesService, deliveriesService } from '@/services/deliveries'
import { usersService } from '@/services/users'
import type { DeliveryOrder, DeliveryZone, DeliveryZoneType, OrderStatus } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/api'
import { formatCurrency, formatDateTime, orderStatusLabels } from '@/utils/format'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/utils/cn'

const zoneSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  zoneType: z.enum(['NEIGHBORHOOD', 'REGION', 'ZIP', 'RADIUS']),
  fee: z.coerce.number().min(0, 'Taxa inválida'),
  minOrderValue: z.coerce.number().min(0).optional().nullable(),
  estimatedMinutes: z.coerce.number().min(0).optional().nullable(),
  zipPrefix: z.string().optional(),
  radiusKm: z.coerce.number().min(0).optional().nullable(),
  isActive: z.boolean().optional(),
})

type ZoneForm = z.infer<typeof zoneSchema>

interface ZonePayload {
  name: string
  zoneType: DeliveryZoneType
  fee: number
  minOrderValue: number | null
  estimatedMinutes: number | null
  zipPrefix?: string
  radiusKm: number | null
  isActive?: boolean
}

const ZONE_TYPE_OPTIONS: { value: DeliveryZoneType; label: string }[] = [
  { value: 'NEIGHBORHOOD', label: 'Bairro' },
  { value: 'REGION', label: 'Região' },
  { value: 'ZIP', label: 'Faixa de CEP' },
  { value: 'RADIUS', label: 'Raio (km)' },
]

const zoneTypeLabels: Record<DeliveryZoneType, string> = {
  NEIGHBORHOOD: 'Bairro',
  REGION: 'Região',
  ZIP: 'Faixa de CEP',
  RADIUS: 'Raio',
}

export function DeliveriesPage() {
  const [tab, setTab] = useState<'zonas' | 'operacional'>('zonas')

  return (
    <div>
      <PageHeader
        title="Entregas"
        description="Acompanhe entregas e entregadores"
      />

      <div className="mb-6 flex rounded-[var(--radius-md)] border border-border bg-surface p-0.5 w-fit">
        <button
          type="button"
          onClick={() => setTab('zonas')}
          className={cn(
            'flex items-center gap-2 rounded-[var(--radius-sm)] px-4 py-2 text-sm transition-colors',
            tab === 'zonas' ? 'bg-accent-muted text-accent font-medium' : 'text-muted hover:text-text',
          )}
        >
          <MapPin className="h-4 w-4" />
          Zonas
        </button>
        <button
          type="button"
          onClick={() => setTab('operacional')}
          className={cn(
            'flex items-center gap-2 rounded-[var(--radius-sm)] px-4 py-2 text-sm transition-colors',
            tab === 'operacional' ? 'bg-accent-muted text-accent font-medium' : 'text-muted hover:text-text',
          )}
        >
          <Truck className="h-4 w-4" />
          Operacional
        </button>
      </div>

      {tab === 'zonas' ? <ZonesTab /> : <OperationalTab />}
    </div>
  )
}

function ZonesTab() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DeliveryZone | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<DeliveryZone | null>(null)
  const queryClient = useQueryClient()

  const { data: zones = [], isLoading, error } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: deliveryZonesService.list,
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ZoneForm>({
    resolver: zodResolver(zoneSchema),
    defaultValues: { zoneType: 'NEIGHBORHOOD', fee: 0, isActive: true },
  })

  const zoneType = watch('zoneType')

  const createMutation = useMutation({
    mutationFn: deliveryZonesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ZonePayload }) =>
      deliveryZonesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deliveryZonesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] })
      setDeleteConfirm(null)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      deliveryZonesService.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['delivery-zones'] }),
  })

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', zoneType: 'NEIGHBORHOOD', fee: 0, isActive: true })
    setModalOpen(true)
  }

  const openEdit = (zone: DeliveryZone) => {
    setEditing(zone)
    reset({
      name: zone.name,
      zoneType: zone.zoneType,
      fee: zone.fee,
      minOrderValue: zone.minOrderValue,
      estimatedMinutes: zone.estimatedMinutes,
      zipPrefix: zone.zipPrefix || '',
      radiusKm: zone.radiusKm,
      isActive: zone.isActive,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    reset()
  }

  const onSubmit = async (data: ZoneForm) => {
    try {
      const payload: ZonePayload = {
        name: data.name,
        zoneType: data.zoneType,
        fee: data.fee,
        isActive: data.isActive,
        zipPrefix: data.zipPrefix,
        minOrderValue: data.minOrderValue || null,
        estimatedMinutes: data.estimatedMinutes || null,
        radiusKm: data.radiusKm || null,
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

  const sortedZones = [...zones].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova zona
        </Button>
      </div>

      {isLoading && <TableSkeleton rows={4} />}

      {error && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center text-danger">
          Erro ao carregar zonas de entrega
        </div>
      )}

      {!isLoading && !error && sortedZones.length === 0 && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
          <EmptyState
            icon={MapPin}
            title="Nenhuma zona de entrega"
            description="Configure zonas para calcular taxas de entrega automaticamente."
            action={{ label: 'Nova zona', onClick: openCreate }}
          />
        </div>
      )}

      {!isLoading && sortedZones.length > 0 && (
        <div className="space-y-2">
          {sortedZones.map((zone) => (
            <div
              key={zone.id}
              className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-text">{zone.name}</h3>
                  <Badge variant={zone.isActive ? 'success' : 'muted'}>
                    {zone.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                  <Badge variant="accent">{zoneTypeLabels[zone.zoneType]}</Badge>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
                  <span className="font-medium text-accent">{formatCurrency(zone.fee)}</span>
                  {zone.minOrderValue != null && (
                    <span>Pedido mín. {formatCurrency(zone.minOrderValue)}</span>
                  )}
                  {zone.estimatedMinutes != null && <span>~{zone.estimatedMinutes} min</span>}
                  {zone.zipPrefix && <span>CEP {zone.zipPrefix}</span>}
                  {zone.radiusKm != null && <span>{zone.radiusKm} km</span>}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleMutation.mutate({ id: zone.id, isActive: !zone.isActive })}
                >
                  {zone.isActive ? 'Desativar' : 'Ativar'}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(zone)} aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteConfirm(zone)}
                  aria-label="Excluir"
                  className="text-danger hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar zona' : 'Nova zona de entrega'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome" error={errors.name?.message} {...register('name')} />
          <Select
            label="Tipo"
            options={ZONE_TYPE_OPTIONS}
            error={errors.zoneType?.message}
            {...register('zoneType')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Taxa (R$)"
              type="number"
              step="0.01"
              error={errors.fee?.message}
              {...register('fee')}
            />
            <Input
              label="Tempo estimado (min)"
              type="number"
              {...register('estimatedMinutes')}
            />
          </div>
          <Input
            label="Pedido mínimo (R$)"
            type="number"
            step="0.01"
            {...register('minOrderValue')}
          />
          {zoneType === 'ZIP' && (
            <Input label="Prefixo de CEP" placeholder="Ex: 01000" {...register('zipPrefix')} />
          )}
          {zoneType === 'RADIUS' && (
            <Input label="Raio (km)" type="number" step="0.1" {...register('radiusKm')} />
          )}
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" {...register('isActive')} className="rounded border-border" />
            Zona ativa
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
        title="Excluir zona"
        size="sm"
      >
        <p className="text-sm text-muted">
          Excluir <strong className="text-text">{deleteConfirm?.name}</strong>?
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

const OPERATIONAL_STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'CONFIRMED', label: orderStatusLabels.CONFIRMED },
  { value: 'PREPARING', label: orderStatusLabels.PREPARING },
  { value: 'READY', label: orderStatusLabels.READY },
  { value: 'OUT_FOR_DELIVERY', label: orderStatusLabels.OUT_FOR_DELIVERY },
  { value: 'COMPLETED', label: orderStatusLabels.COMPLETED },
]

function OperationalTab() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const debouncedSearch = useDebounce(search)
  const queryClient = useQueryClient()

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['deliveries', statusFilter, debouncedSearch],
    queryFn: () =>
      deliveriesService.list({
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
      }),
  })

  const { data: employees = [] } = useQuery({
    queryKey: ['users'],
    queryFn: usersService.list,
  })

  const deliveryUsers = employees.filter((u) => u.isActive)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['deliveries'] })

  const assignMutation = useMutation({
    mutationFn: ({ orderId, userId }: { orderId: string; userId: string | null }) =>
      deliveriesService.assignDeliveryUser(orderId, userId),
    onSuccess: invalidate,
  })

  const leftMutation = useMutation({
    mutationFn: (orderId: string) => deliveriesService.markLeft(orderId),
    onSuccess: invalidate,
  })

  const completedMutation = useMutation({
    mutationFn: (orderId: string) => deliveriesService.markCompleted(orderId),
    onSuccess: invalidate,
  })

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Buscar por código, cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface pl-9 pr-3 text-sm text-text placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            aria-label="Buscar entregas"
          />
        </div>
        <Select
          options={OPERATIONAL_STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
          className="sm:w-52"
        />
      </div>

      {isLoading && <TableSkeleton rows={6} />}

      {error && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center text-danger">
          Erro ao carregar entregas
        </div>
      )}

      {!isLoading && !error && orders.length === 0 && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
          <EmptyState
            icon={Truck}
            title="Nenhuma entrega encontrada"
            description="Pedidos de delivery aparecerão aqui para acompanhamento."
          />
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <div className="space-y-2">
          {orders.map((order: DeliveryOrder) => (
            <div
              key={order.id}
              className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 lg:flex-row lg:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-text">#{order.code}</h3>
                  <StatusBadge status={order.status} size="sm" />
                </div>
                <p className="text-sm text-muted">{order.customer?.name || 'Cliente não identificado'}</p>
                {order.address && (
                  <p className="text-xs text-muted">
                    {order.address.street}, {order.address.number || 's/n'} —{' '}
                    {order.address.neighborhood}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted">
                  <span>{formatDateTime(order.createdAt)}</span>
                  <span className="font-medium text-accent">{formatCurrency(order.total)}</span>
                  {order.deliveryLeftAt && (
                    <span className="flex items-center gap-1">
                      <Flag className="h-3 w-3" /> Saiu: {formatDateTime(order.deliveryLeftAt)}
                    </span>
                  )}
                  {order.deliveryCompletedAt && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Entregue:{' '}
                      {formatDateTime(order.deliveryCompletedAt)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  options={[
                    { value: '', label: 'Sem entregador' },
                    ...deliveryUsers.map((u) => ({ value: u.id, label: u.name })),
                  ]}
                  value={order.assignedDeliveryUserId || ''}
                  onChange={(e) =>
                    assignMutation.mutate({ orderId: order.id, userId: e.target.value || null })
                  }
                  className="w-44"
                  aria-label="Atribuir entregador"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!order.deliveryLeftAt}
                  isLoading={leftMutation.isPending}
                  onClick={() => leftMutation.mutate(order.id)}
                >
                  Saiu p/ entrega
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!order.deliveryCompletedAt}
                  isLoading={completedMutation.isPending}
                  onClick={() => completedMutation.mutate(order.id)}
                >
                  Concluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
