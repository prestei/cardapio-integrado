import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Users, Pencil, Trash2, Phone, Mail, MapPin, ShoppingBag } from 'lucide-react'
import { customersService } from '@/services/customers'
import type { CustomerListItem } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton, Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/api'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import { useDebounce } from '@/hooks/useDebounce'

const editSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  phone: z.string().min(1, 'Telefone obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
})

type EditForm = z.infer<typeof editSchema>

export function CustomersPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [selected, setSelected] = useState<CustomerListItem | null>(null)
  const [editing, setEditing] = useState<CustomerListItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<CustomerListItem | null>(null)
  const queryClient = useQueryClient()

  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ['customers', debouncedSearch],
    queryFn: () => customersService.list(debouncedSearch || undefined),
  })

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EditForm>({ resolver: zodResolver(editSchema) })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditForm }) =>
      customersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      closeEdit()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: customersService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setDeleteConfirm(null)
    },
  })

  const openEdit = (customer: CustomerListItem) => {
    setEditing(customer)
    reset({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      isActive: customer.isActive,
    })
  }

  const closeEdit = () => {
    setEditing(null)
    reset()
  }

  const onSubmit = async (data: EditForm) => {
    if (!editing) return
    try {
      await updateMutation.mutateAsync({
        id: editing.id,
        data: { ...data, email: data.email || undefined },
      })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erro ao salvar'
      setError('root', { message })
    }
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Visualize e gerencie sua base de clientes"
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          placeholder="Buscar por nome, telefone ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface pl-9 pr-3 text-sm text-text placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          aria-label="Buscar clientes"
        />
      </div>

      {isLoading && <TableSkeleton rows={8} />}

      {error && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center text-danger">
          Erro ao carregar clientes
        </div>
      )}

      {!isLoading && !error && customers.length === 0 && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
          <EmptyState
            icon={Users}
            title="Nenhum cliente encontrado"
            description="Seus clientes aparecerão aqui conforme fizerem pedidos."
          />
        </div>
      )}

      {!isLoading && !error && customers.length > 0 && (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-elevated text-left text-muted">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium">Pedidos</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="cursor-pointer border-b border-border/50 hover:bg-elevated/50"
                  onClick={() => setSelected(customer)}
                >
                  <td className="px-4 py-3 font-medium text-text">{customer.name}</td>
                  <td className="px-4 py-3 text-muted">
                    <div>{customer.phone}</div>
                    {customer.email && <div className="text-xs">{customer.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted">{customer._count?.orders ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={customer.isActive ? 'success' : 'muted'}>
                      {customer.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(customer)} aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(customer)}
                        aria-label="Excluir"
                        className="text-danger hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? selected.name : ''}
        size="lg"
      >
        {selected && <CustomerDetail customerId={selected.id} />}
      </Modal>

      <Modal
        open={!!editing}
        onClose={closeEdit}
        title="Editar cliente"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome" error={errors.name?.message} {...register('name')} />
          <Input label="Telefone" error={errors.phone?.message} {...register('phone')} />
          <Input label="E-mail" type="email" error={errors.email?.message} {...register('email')} />
          <Textarea label="Observações" {...register('notes')} />
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" {...register('isActive')} className="rounded border-border" />
            Cliente ativo
          </label>
          {errors.root && <p className="text-sm text-danger">{errors.root.message}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={closeEdit}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Excluir cliente"
        size="sm"
      >
        <p className="text-sm text-muted">
          Excluir <strong className="text-text">{deleteConfirm?.name}</strong>? Esta ação não pode
          ser desfeita.
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

function CustomerDetail({ customerId }: { customerId: string }) {
  const { data: customer, isLoading } = useQuery({
    queryKey: ['customers', customerId],
    queryFn: () => customersService.getById(customerId),
  })

  if (isLoading || !customer) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-2 text-sm text-text">
          <Phone className="h-4 w-4 text-muted" /> {customer.phone}
        </div>
        {customer.email && (
          <div className="flex items-center gap-2 text-sm text-text">
            <Mail className="h-4 w-4 text-muted" /> {customer.email}
          </div>
        )}
      </div>

      {customer.notes && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Observações</p>
          <p className="text-sm text-text">{customer.notes}</p>
        </div>
      )}

      {customer.stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-[var(--radius-md)] border border-border bg-elevated p-3">
            <p className="text-xs text-muted">Pedidos</p>
            <p className="font-display text-lg font-semibold text-text">
              {customer.stats.totalOrders}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border bg-elevated p-3">
            <p className="text-xs text-muted">Total gasto</p>
            <p className="font-display text-lg font-semibold text-text">
              {formatCurrency(customer.stats.totalSpent)}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border bg-elevated p-3">
            <p className="text-xs text-muted">Ticket médio</p>
            <p className="font-display text-lg font-semibold text-text">
              {formatCurrency(customer.stats.avgTicket)}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border bg-elevated p-3">
            <p className="text-xs text-muted">Último pedido</p>
            <p className="font-display text-sm font-semibold text-text">
              {customer.stats.lastOrderAt ? formatDate(customer.stats.lastOrderAt) : '—'}
            </p>
          </div>
        </div>
      )}

      {customer.addresses && customer.addresses.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted">
            <MapPin className="h-3.5 w-3.5" /> Endereços
          </p>
          <ul className="space-y-2">
            {customer.addresses.map((address) => (
              <li
                key={address.id}
                className="rounded-[var(--radius-md)] border border-border bg-elevated px-3 py-2 text-sm text-text"
              >
                {address.street}, {address.number || 's/n'} {address.complement || ''} —{' '}
                {address.neighborhood}, {address.city}
                {address.isDefault && (
                  <Badge variant="accent" className="ml-2">Padrão</Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted">
          <ShoppingBag className="h-3.5 w-3.5" /> Histórico de pedidos
        </p>
        {!customer.orders || customer.orders.length === 0 ? (
          <p className="text-sm text-muted">Nenhum pedido registrado.</p>
        ) : (
          <ul className="space-y-2">
            {customer.orders.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-border bg-elevated px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-text">#{order.code}</p>
                  <p className="text-xs text-muted">{formatDateTime(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={order.status} size="sm" />
                  <span className="text-sm font-medium text-text">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
