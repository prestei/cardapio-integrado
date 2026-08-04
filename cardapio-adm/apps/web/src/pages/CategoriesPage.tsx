import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  FolderOpen,
} from 'lucide-react'
import { categoriesService } from '@/services/categories'
import type { Category } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/api'

const categorySchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

type CategoryForm = z.infer<typeof categorySchema>

export function CategoriesPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null)
  const queryClient = useQueryClient()

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.list,
  })

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { isActive: true },
  })

  const createMutation = useMutation({
    mutationFn: categoriesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryForm }) =>
      categoriesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: categoriesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setDeleteConfirm(null)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      categoriesService.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })

  const reorderMutation = useMutation({
    mutationFn: categoriesService.reorder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', description: '', isActive: true })
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    reset({
      name: cat.name,
      description: cat.description || '',
      isActive: cat.isActive,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    reset()
  }

  const onSubmit = async (data: CategoryForm) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data })
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          description: data.description,
          isActive: data.isActive,
        })
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erro ao salvar'
      setError('root', { message })
    }
  }

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder)
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= sorted.length) return

    const items = sorted.map((cat, i) => {
      if (i === index) return { id: cat.id, sortOrder: sorted[swapIndex].sortOrder }
      if (i === swapIndex) return { id: cat.id, sortOrder: sorted[index].sortOrder }
      return { id: cat.id, sortOrder: cat.sortOrder }
    })

    reorderMutation.mutate(items)
  }

  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div>
      <PageHeader
        title="Categorias"
        description="Organize seu cardápio em categorias"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nova categoria
          </Button>
        }
      />

      {isLoading && <TableSkeleton rows={5} />}

      {error && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center text-danger">
          Erro ao carregar categorias
        </div>
      )}

      {!isLoading && !error && categories.length === 0 && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
          <EmptyState
            icon={FolderOpen}
            title="Nenhuma categoria"
            description="Crie sua primeira categoria para organizar os produtos."
            action={{ label: 'Nova categoria', onClick: openCreate }}
          />
        </div>
      )}

      {!isLoading && sortedCategories.length > 0 && (
        <div className="space-y-2">
          {sortedCategories.map((cat, index) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveCategory(index, 'up')}
                  disabled={index === 0 || reorderMutation.isPending}
                  className="rounded p-0.5 text-muted hover:bg-elevated hover:text-text disabled:opacity-30"
                  aria-label="Mover para cima"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveCategory(index, 'down')}
                  disabled={index === sortedCategories.length - 1 || reorderMutation.isPending}
                  className="rounded p-0.5 text-muted hover:bg-elevated hover:text-text disabled:opacity-30"
                  aria-label="Mover para baixo"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-text">{cat.name}</h3>
                  <Badge variant={cat.isActive ? 'success' : 'muted'}>
                    {cat.isActive ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                {cat.description && (
                  <p className="mt-0.5 truncate text-sm text-muted">{cat.description}</p>
                )}
                <p className="mt-1 text-xs text-muted">
                  {cat._count?.products ?? 0} produto(s)
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    toggleMutation.mutate({ id: cat.id, isActive: !cat.isActive })
                  }
                >
                  {cat.isActive ? 'Desativar' : 'Ativar'}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(cat)} aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteConfirm(cat)}
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
        title={editing ? 'Editar categoria' : 'Nova categoria'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nome"
            error={errors.name?.message}
            {...register('name')}
          />
          <Textarea
            label="Descrição"
            {...register('description')}
          />
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" {...register('isActive')} className="rounded border-border" />
            Categoria ativa
          </label>
          {errors.root && (
            <p className="text-sm text-danger">{errors.root.message}</p>
          )}
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
        title="Excluir categoria"
        size="sm"
      >
        <p className="text-sm text-muted">
          Tem certeza que deseja excluir <strong className="text-text">{deleteConfirm?.name}</strong>?
          Esta ação não pode ser desfeita.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
            Cancelar
          </Button>
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
