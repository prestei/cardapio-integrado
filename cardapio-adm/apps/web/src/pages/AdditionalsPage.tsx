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
import { TableSkeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/api'
import { formatCurrency } from '@/utils/format'
import { useDebounce } from '@/hooks/useDebounce'

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

export function AdditionalsPage() {
  const [search, setSearch] = useState('')
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

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
  )

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

  return (
    <div>
      <PageHeader
        title="Adicionais"
        description="Gerencie grupos de adicionais e complementos"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo grupo
          </Button>
        }
      />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          placeholder="Buscar grupo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-[var(--radius-md)] border border-border bg-surface pl-9 pr-3 text-sm text-text placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          aria-label="Buscar grupos de adicionais"
        />
      </div>

      {isLoading && <TableSkeleton rows={5} />}

      {error && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center text-danger">
          Erro ao carregar adicionais
        </div>
      )}

      {!isLoading && !error && filteredGroups.length === 0 && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
          <EmptyState
            icon={PlusCircle}
            title="Nenhum grupo de adicionais"
            description="Crie grupos de adicionais para complementar seus produtos."
            action={{ label: 'Novo grupo', onClick: openCreate }}
          />
        </div>
      )}

      {!isLoading && filteredGroups.length > 0 && (
        <div className="space-y-2">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium text-text">{group.name}</h3>
                  <Badge variant={group.isActive ? 'success' : 'muted'}>
                    {group.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Badge variant="accent">
                    {group.selectionType === 'SINGLE' ? 'Escolha única' : 'Múltipla escolha'}
                  </Badge>
                  {group.isRequired && <Badge variant="warning">Obrigatório</Badge>}
                </div>
                {group.description && (
                  <p className="mt-0.5 truncate text-sm text-muted">{group.description}</p>
                )}
                <p className="mt-1 text-xs text-muted">
                  {group.additionals?.length ?? group._count?.additionals ?? 0} opção(ões) ·
                  {' '}min {group.minQuantity} / max {group.maxQuantity} ·
                  {' '}{group.products?.length ?? group._count?.products ?? 0} produto(s) vinculado(s)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setManagingOptions(group)}>
                  <Settings2 className="h-4 w-4" />
                  Opções
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setLinkingProducts(group)}>
                  <Link2 className="h-4 w-4" />
                  Produtos
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    toggleMutation.mutate({ id: group.id, isActive: !group.isActive })
                  }
                >
                  {group.isActive ? 'Desativar' : 'Ativar'}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(group)} aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteConfirm(group)}
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
