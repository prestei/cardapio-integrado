import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  PlusCircle,
  Settings2,
  Link2,
  X,
  CircleDot,
  ListChecks,
  CheckCircle2,
  Package,
  Power,
  Layers,
} from 'lucide-react'
import { additionalsService } from '@/services/additionals'
import { productsService } from '@/services/products'
import type { Additional, AdditionalGroup } from '@/types'
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
import { formatCurrency } from '@/utils/format'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/utils/cn'

const groupSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  description: z.string().optional(),
  selectionType: z.enum(['SINGLE', 'MULTIPLE']),
  isRequired: z.boolean().optional(),
  minQuantity: z.coerce.number().min(0).optional(),
  maxQuantity: z.coerce.number().min(1).optional(),
  isActive: z.boolean().optional(),
})

type GroupForm = z.infer<typeof groupSchema>

const SELECTION_OPTIONS = [
  { value: 'SINGLE', label: 'Escolha única' },
  { value: 'MULTIPLE', label: 'Múltipla escolha' },
]

type StatusFilter = 'all' | 'active' | 'inactive' | 'empty'

function optionCount(group: AdditionalGroup) {
  return group.additionals?.length ?? group._count?.additionals ?? 0
}

function productCount(group: AdditionalGroup) {
  return group._count?.products ?? group.products?.length ?? 0
}

function optionCountLabel(n: number) {
  if (n === 0) return 'Nenhuma opção'
  if (n === 1) return '1 opção'
  return `${n} opções`
}

function productCountLabel(n: number) {
  if (n === 0) return 'Nenhum produto'
  if (n === 1) return '1 produto'
  return `${n} produtos`
}

function AdditionalsSkeleton() {
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
          <Skeleton key={i} className="h-32 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    </div>
  )
}

export function AdditionalsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const debouncedSearch = useDebounce(search)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdditionalGroup | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<AdditionalGroup | null>(null)
  const [managingOptions, setManagingOptions] = useState<AdditionalGroup | null>(null)
  const [linkingProducts, setLinkingProducts] = useState<AdditionalGroup | null>(null)
  const queryClient = useQueryClient()

  const { data: groups = [], isLoading, error } = useQuery({
    queryKey: ['additional-groups'],
    queryFn: additionalsService.list,
  })

  const filteredGroups = groups.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    if (!matchesSearch) return false
    if (statusFilter === 'active') return g.isActive
    if (statusFilter === 'inactive') return !g.isActive
    if (statusFilter === 'empty') return optionCount(g) === 0
    return true
  })

  const activeCount = groups.filter((g) => g.isActive).length
  const totalOptions = groups.reduce((sum, g) => sum + optionCount(g), 0)
  const totalLinked = groups.reduce((sum, g) => sum + productCount(g), 0)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      selectionType: 'SINGLE',
      isRequired: false,
      minQuantity: 0,
      maxQuantity: 1,
      isActive: true,
    },
  })

  const createMutation = useMutation({
    mutationFn: additionalsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['additional-groups'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: GroupForm }) =>
      additionalsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['additional-groups'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: additionalsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['additional-groups'] })
      setDeleteConfirm(null)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      additionalsService.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['additional-groups'] }),
  })

  const openCreate = () => {
    setEditing(null)
    reset({
      name: '',
      description: '',
      selectionType: 'SINGLE',
      isRequired: false,
      minQuantity: 0,
      maxQuantity: 1,
      isActive: true,
    })
    setModalOpen(true)
  }

  const openEdit = (group: AdditionalGroup) => {
    setEditing(group)
    reset({
      name: group.name,
      description: group.description || '',
      selectionType: group.selectionType,
      isRequired: group.isRequired,
      minQuantity: group.minQuantity,
      maxQuantity: group.maxQuantity,
      isActive: group.isActive,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    reset()
  }

  const onSubmit = async (data: GroupForm) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data })
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          description: data.description,
          selectionType: data.selectionType,
          isRequired: data.isRequired,
          minQuantity: data.minQuantity,
          maxQuantity: data.maxQuantity,
          isActive: data.isActive,
        })
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erro ao salvar'
      setError('root', { message })
    }
  }

  const filters: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'active', label: 'Ativos' },
    { id: 'inactive', label: 'Inativos' },
    { id: 'empty', label: 'Sem opções' },
  ]

  return (
    <div>
      <PageHeader
        title="Adicionais"
        description="Grupos de extras que o cliente escolhe na hora de pedir — bacon, ponto da carne, molhos."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo grupo
          </Button>
        }
      />

      {isLoading && <AdditionalsSkeleton />}

      {error && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center text-danger">
          Erro ao carregar adicionais
        </div>
      )}

      {!isLoading && !error && groups.length === 0 && (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          <div className="h-1.5 bg-gradient-to-r from-accent via-gold to-success" />
          <EmptyState
            icon={PlusCircle}
            title="Monte os extras do pedido"
            description="Crie um grupo (ex.: Molhos, Ponto da carne) e cadastre as opções. Depois vincule aos produtos do cardápio."
            action={{ label: 'Novo grupo', onClick: openCreate }}
          />
        </div>
      )}

      {!isLoading && groups.length > 0 && (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-accent-muted">
                <Layers className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-text">{groups.length}</p>
                <p className="text-sm text-muted">Grupos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-success/15">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-text">{activeCount}</p>
                <p className="text-sm text-muted">Ativos no cardápio</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-gold-muted">
                <ListChecks className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-text">{totalOptions}</p>
                <p className="text-sm text-muted">Opções cadastradas</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[#3b82f6]/15">
                <Package className="h-5 w-5 text-[#60a5fa]" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-text">{totalLinked}</p>
                <p className="text-sm text-muted">Produtos vinculados</p>
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                placeholder="Buscar grupo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-elevated pr-3 pl-9 text-sm text-text placeholder:text-muted/60 focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
                aria-label="Buscar grupos de adicionais"
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

          {filteredGroups.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
              <EmptyState
                icon={Search}
                title="Nenhum grupo neste filtro"
                description="Tente outro termo ou limpe os filtros para ver todos os grupos."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGroups.map((group) => {
                const options = group.additionals ?? []
                const optionsN = optionCount(group)
                const productsN = productCount(group)
                const single = group.selectionType === 'SINGLE'
                const Icon = single ? CircleDot : ListChecks

                return (
                  <div
                    key={group.id}
                    className={cn(
                      'relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface',
                      'transition-colors duration-150 hover:border-accent/35 hover:bg-elevated/40',
                      !group.isActive && 'opacity-75',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute inset-y-0 left-0 w-1',
                        !group.isActive ? 'bg-muted' : single ? 'bg-accent' : 'bg-gold',
                      )}
                      aria-hidden="true"
                    />

                    <div className="flex flex-col gap-4 p-4 pl-5 sm:flex-row sm:items-center sm:gap-4">
                      <div
                        className={cn(
                          'flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--radius-md)]',
                          !group.isActive
                            ? 'bg-elevated text-muted'
                            : single
                              ? 'bg-accent-muted text-accent'
                              : 'bg-gold-muted text-gold',
                        )}
                      >
                        <Icon className="h-7 w-7" strokeWidth={1.6} aria-hidden="true" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-base font-semibold text-text sm:text-lg">
                            {group.name}
                          </h3>
                          <Badge variant={group.isActive ? 'success' : 'muted'}>
                            {group.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Badge variant={single ? 'accent' : 'default'}>
                            {single ? 'Escolha única' : 'Múltipla escolha'}
                          </Badge>
                          {group.isRequired && <Badge variant="warning">Obrigatório</Badge>}
                        </div>

                        {group.description ? (
                          <p className="mt-1 line-clamp-1 text-sm text-muted">{group.description}</p>
                        ) : (
                          <p className="mt-1 text-sm text-muted/60 italic">Sem descrição</p>
                        )}

                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs',
                              optionsN === 0 ? 'bg-gold-muted text-gold' : 'bg-elevated text-muted',
                            )}
                          >
                            <ListChecks className="h-3.5 w-3.5" />
                            {optionCountLabel(optionsN)}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-elevated px-2.5 py-1 text-xs text-muted">
                            min {group.minQuantity} · max {group.maxQuantity}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-elevated px-2.5 py-1 text-xs text-muted">
                            <Package className="h-3.5 w-3.5" />
                            {productCountLabel(productsN)}
                          </span>
                        </div>

                        {options.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {options.slice(0, 5).map((option) => (
                              <span
                                key={option.id}
                                className="inline-flex max-w-[10rem] truncate rounded-[var(--radius-sm)] border border-border bg-bg/60 px-2 py-0.5 text-[11px] text-text"
                              >
                                {option.name}
                                {option.price > 0 ? ` · ${formatCurrency(option.price)}` : ''}
                              </span>
                            ))}
                            {options.length > 5 && (
                              <span className="inline-flex rounded-[var(--radius-sm)] px-2 py-0.5 text-[11px] text-muted">
                                +{options.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2 self-end sm:flex-col sm:items-stretch lg:flex-row lg:items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setManagingOptions(group)}
                        >
                          <Settings2 className="h-4 w-4" />
                          Opções
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLinkingProducts(group)}
                        >
                          <Link2 className="h-4 w-4" />
                          Produtos
                        </Button>
                        <div className="flex items-center gap-0.5 rounded-[var(--radius-md)] bg-elevated/80 p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              toggleMutation.mutate({ id: group.id, isActive: !group.isActive })
                            }
                            aria-label={group.isActive ? 'Desativar' : 'Ativar'}
                            title={group.isActive ? 'Desativar' : 'Ativar'}
                            className={cn(group.isActive ? 'text-success' : 'text-muted')}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(group)}
                            aria-label="Editar"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirm(group)}
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
        title={editing ? 'Editar grupo' : 'Novo grupo de adicionais'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome" error={errors.name?.message} {...register('name')} />
          <Textarea label="Descrição" {...register('description')} />
          <Select
            label="Tipo de seleção"
            options={SELECTION_OPTIONS}
            error={errors.selectionType?.message}
            {...register('selectionType')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Qtd. mínima"
              type="number"
              min={0}
              error={errors.minQuantity?.message}
              {...register('minQuantity')}
            />
            <Input
              label="Qtd. máxima"
              type="number"
              min={1}
              error={errors.maxQuantity?.message}
              {...register('maxQuantity')}
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-text">
              <input type="checkbox" {...register('isRequired')} className="rounded border-border" />
              Obrigatório
            </label>
            <label className="flex items-center gap-2 text-sm text-text">
              <input type="checkbox" {...register('isActive')} className="rounded border-border" />
              Ativo
            </label>
          </div>
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
        title="Excluir grupo"
        size="sm"
      >
        <p className="text-sm text-muted">
          Excluir <strong className="text-text">{deleteConfirm?.name}</strong>? Todas as opções
          associadas também serão removidas.
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

      <Modal
        open={!!managingOptions}
        onClose={() => setManagingOptions(null)}
        title={managingOptions ? `Opções — ${managingOptions.name}` : ''}
        size="lg"
      >
        {managingOptions && <OptionsManager group={managingOptions} />}
      </Modal>

      <Modal
        open={!!linkingProducts}
        onClose={() => setLinkingProducts(null)}
        title={linkingProducts ? `Produtos vinculados — ${linkingProducts.name}` : ''}
        size="md"
      >
        {linkingProducts && (
          <ProductLinker group={linkingProducts} onClose={() => setLinkingProducts(null)} />
        )}
      </Modal>
    </div>
  )
}

const optionSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Preço inválido'),
  isAvailable: z.boolean().optional(),
})

type OptionForm = z.infer<typeof optionSchema>

function OptionsManager({ group }: { group: AdditionalGroup }) {
  const queryClient = useQueryClient()
  const [editingOption, setEditingOption] = useState<Additional | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteOption, setDeleteOption] = useState<Additional | null>(null)

  const { data: groupData } = useQuery({
    queryKey: ['additional-groups', group.id],
    queryFn: () => additionalsService.getById(group.id),
    initialData: group,
  })

  const options = groupData?.additionals ?? []

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OptionForm>({
    resolver: zodResolver(optionSchema),
    defaultValues: { price: 0, isAvailable: true },
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['additional-groups'] })
  }

  const createMutation = useMutation({
    mutationFn: (data: OptionForm) =>
      additionalsService.createOption(group.id, {
        name: data.name,
        description: data.description,
        price: data.price,
        isAvailable: data.isAvailable,
      }),
    onSuccess: () => {
      invalidate()
      closeForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: OptionForm }) =>
      additionalsService.updateOption(group.id, id, {
        name: data.name,
        description: data.description,
        price: data.price,
        isAvailable: data.isAvailable,
      }),
    onSuccess: () => {
      invalidate()
      closeForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => additionalsService.deleteOption(group.id, id),
    onSuccess: () => {
      invalidate()
      setDeleteOption(null)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      additionalsService.updateOption(group.id, id, { isAvailable }),
    onSuccess: invalidate,
  })

  const openCreateOption = () => {
    setEditingOption(null)
    reset({ name: '', description: '', price: 0, isAvailable: true })
    setShowForm(true)
  }

  const openEditOption = (option: Additional) => {
    setEditingOption(option)
    reset({
      name: option.name,
      description: option.description || '',
      price: option.price,
      isAvailable: option.isAvailable,
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingOption(null)
    reset()
  }

  const onSubmit = (data: OptionForm) => {
    if (editingOption) {
      updateMutation.mutate({ id: editingOption.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <div className="space-y-4">
      {options.length === 0 && !showForm && (
        <p className="py-6 text-center text-sm text-muted">Nenhuma opção cadastrada ainda.</p>
      )}

      {options.length > 0 && (
        <ul className="space-y-2">
          {options.map((option) => (
            <li
              key={option.id}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-elevated px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-text">{option.name}</p>
                  <Badge variant={option.isAvailable ? 'success' : 'muted'}>
                    {option.isAvailable ? 'Disponível' : 'Indisponível'}
                  </Badge>
                </div>
                <p className="text-xs text-muted">{formatCurrency(option.price)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    toggleMutation.mutate({ id: option.id, isAvailable: !option.isAvailable })
                  }
                >
                  {option.isAvailable ? 'Indisponibilizar' : 'Disponibilizar'}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEditOption(option)} aria-label="Editar opção">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteOption(option)}
                  aria-label="Excluir opção"
                  className="text-danger hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm ? (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3 rounded-[var(--radius-md)] border border-border bg-bg p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text">
              {editingOption ? 'Editar opção' : 'Nova opção'}
            </p>
            <Button variant="ghost" size="icon" onClick={closeForm} aria-label="Fechar">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Input label="Nome" error={errors.name?.message} {...register('name')} />
          <Textarea label="Descrição" {...register('description')} />
          <Input
            label="Preço (R$)"
            type="number"
            step="0.01"
            error={errors.price?.message}
            {...register('price')}
          />
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" {...register('isAvailable')} className="rounded border-border" />
            Disponível
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeForm}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingOption ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={openCreateOption} className="w-full">
          <Plus className="h-4 w-4" />
          Adicionar opção
        </Button>
      )}

      <Modal
        open={!!deleteOption}
        onClose={() => setDeleteOption(null)}
        title="Excluir opção"
        size="sm"
      >
        <p className="text-sm text-muted">
          Excluir <strong className="text-text">{deleteOption?.name}</strong>?
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteOption(null)}>Cancelar</Button>
          <Button
            variant="danger"
            isLoading={deleteMutation.isPending}
            onClick={() => deleteOption && deleteMutation.mutate(deleteOption.id)}
          >
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function ProductLinker({ group, onClose }: { group: AdditionalGroup; onClose: () => void }) {
  const queryClient = useQueryClient()
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsService.list(),
  })

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set((group.products ?? []).map((p) => p.id)),
  )

  const linkMutation = useMutation({
    mutationFn: (productIds: string[]) => additionalsService.linkProducts(group.id, productIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['additional-groups'] })
      onClose()
    },
  })

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Selecione os produtos que utilizarão este grupo de adicionais.
      </p>
      {products.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">Nenhum produto cadastrado.</p>
      ) : (
        <ul className="max-h-80 space-y-1 overflow-y-auto">
          {products.map((product) => (
            <li key={product.id}>
              <label className="flex items-center gap-3 rounded-[var(--radius-md)] px-2 py-2 text-sm text-text hover:bg-elevated">
                <input
                  type="checkbox"
                  className="rounded border-border"
                  checked={selected.has(product.id)}
                  onChange={() => toggle(product.id)}
                />
                <span className="flex-1 truncate">{product.name}</span>
                <span className="text-xs text-muted">{product.category?.name}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          isLoading={linkMutation.isPending}
          onClick={() => linkMutation.mutate(Array.from(selected))}
        >
          Salvar vínculos
        </Button>
      </div>
    </div>
  )
}
