import { useEffect, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
  GripVertical,
  Package,
  UtensilsCrossed,
  Utensils,
  Coffee,
  Wine,
  Beer,
  IceCream,
  Cake,
  Salad,
  Soup,
  Sandwich,
  Pizza,
  Fish,
  Beef,
  Drumstick,
  CupSoda,
  Cookie,
  Leaf,
  ChefHat,
  Power,
  CheckCircle2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { categoriesService } from '@/services/categories'
import type { Category } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ImageDropzone } from '@/components/ui/ImageDropzone'
import { ApiError } from '@/services/api'
import { cn } from '@/utils/cn'

const categorySchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
})

type CategoryForm = z.infer<typeof categorySchema>

const PALETTE = [
  { wrap: 'bg-accent-muted text-accent', bar: 'bg-accent' },
  { wrap: 'bg-gold-muted text-gold', bar: 'bg-gold' },
  { wrap: 'bg-success/15 text-success', bar: 'bg-success' },
  { wrap: 'bg-[#3b82f6]/15 text-[#60a5fa]', bar: 'bg-[#3b82f6]' },
  { wrap: 'bg-danger/15 text-danger', bar: 'bg-danger' },
  { wrap: 'bg-[#818cf8]/15 text-[#a5b4fc]', bar: 'bg-[#818cf8]' },
] as const

const ICON_RULES: Array<{ test: RegExp; icon: LucideIcon }> = [
  { test: /bebida|drink|suco|refri|água|agua/, icon: CupSoda },
  { test: /cerveja|chopp/, icon: Beer },
  { test: /vinho/, icon: Wine },
  { test: /caf[eé]|espresso/, icon: Coffee },
  { test: /sobremesa|doce|sorvete|gelato|a[cç]a[ií]/, icon: IceCream },
  { test: /bolo|torta/, icon: Cake },
  { test: /lanche|sandu[ií]che|burger|hamb[uú]r/, icon: Sandwich },
  { test: /pizza/, icon: Pizza },
  { test: /entrada|salada/, icon: Salad },
  { test: /sopa/, icon: Soup },
  { test: /peixe|sushi|marisco|camar[aã]o/, icon: Fish },
  { test: /carne|churrasco|steak|bovino/, icon: Beef },
  { test: /frango|chicken|asa/, icon: Drumstick },
  { test: /por[cç][aã]o|petisco/, icon: Utensils },
  { test: /veg|verde|fit/, icon: Leaf },
  { test: /doce|cookie|biscoito/, icon: Cookie },
  { test: /alimento|prato|principal|massa|pasta/, icon: UtensilsCrossed },
]

function paletteFor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

function iconForCategory(name: string): LucideIcon {
  const n = name.toLowerCase()
  return ICON_RULES.find((rule) => rule.test.test(n))?.icon ?? ChefHat
}

function productCountLabel(count: number) {
  if (count === 0) return 'Nenhum produto'
  if (count === 1) return '1 produto'
  return `${count} produtos`
}

function CategoryCover({ category }: { category: Category }) {
  const palette = paletteFor(category.id)
  const Icon = iconForCategory(category.name)

  if (category.imageUrl) {
    return (
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-elevated sm:h-[5.5rem] sm:w-[5.5rem]">
        <img
          src={category.imageUrl}
          alt=""
          className={cn('h-full w-full object-cover', !category.isActive && 'grayscale')}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex h-20 w-20 shrink-0 items-center justify-center rounded-[var(--radius-md)] sm:h-[5.5rem] sm:w-[5.5rem]',
        palette.wrap,
        !category.isActive && 'opacity-50',
      )}
    >
      <Icon className="h-8 w-8" strokeWidth={1.6} aria-hidden="true" />
    </div>
  )
}

function SortableCategoryCard({
  category,
  canDrag,
  children,
}: {
  category: Category
  canDrag: boolean
  children: ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
    disabled: !canDrag,
  })
  const palette = paletteFor(category.id)

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface',
        'transition-colors duration-150 hover:border-accent/35 hover:bg-elevated/40',
        isDragging && 'z-10 border-accent/50 shadow-lg',
        !category.isActive && 'opacity-75',
      )}
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', palette.bar)} aria-hidden="true" />
      <div className="flex items-center gap-3 p-3 pl-4 sm:gap-4 sm:p-4 sm:pl-5">
        {canDrag && (
          <button
            type="button"
            className="shrink-0 cursor-grab touch-none rounded-[var(--radius-sm)] p-1.5 text-muted hover:bg-elevated hover:text-text active:cursor-grabbing"
            aria-label={`Arrastar ${category.name}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}

function CategoriesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[4.5rem] w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
    </div>
  )
}

export function CategoriesPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null)
  const [orderedCategories, setOrderedCategories] = useState<Category[]>([])
  const queryClient = useQueryClient()

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.list,
  })

  useEffect(() => {
    setOrderedCategories(
      [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    )
  }, [categories])

  const canReorder = orderedCategories.length > 1
  const activeCount = orderedCategories.filter((c) => c.isActive).length
  const totalProducts = orderedCategories.reduce((sum, c) => sum + (c._count?.products ?? 0), 0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: { isActive: true, imageUrl: '' },
  })

  const imageUrlValue = watch('imageUrl') || ''

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
    mutationFn: (items: Array<{ id: string; sortOrder: number }>) =>
      categoriesService.reorder(items),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })

  const handleDragEnd = (event: DragEndEvent) => {
    if (!canReorder) return
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = orderedCategories.findIndex((c) => c.id === active.id)
    const newIndex = orderedCategories.findIndex((c) => c.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(orderedCategories, oldIndex, newIndex)
    setOrderedCategories(next)
    reorderMutation.mutate(next.map((c, index) => ({ id: c.id, sortOrder: index })))
  }

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', description: '', imageUrl: '', isActive: true })
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    reset({
      name: cat.name,
      description: cat.description || '',
      imageUrl: cat.imageUrl || '',
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
          imageUrl: data.imageUrl,
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
        title="Categorias"
        description="Organize o cardápio como o cliente vai ver — com nome, capa e ordem."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nova categoria
          </Button>
        }
      />

      {isLoading && <CategoriesSkeleton />}

      {error && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center text-danger">
          Erro ao carregar categorias
        </div>
      )}

      {!isLoading && !error && categories.length === 0 && (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          <div className="h-1.5 bg-gradient-to-r from-accent via-gold to-success" />
          <EmptyState
            icon={UtensilsCrossed}
            title="Monte as seções do cardápio"
            description="Categorias são as abas que o cliente vê: lanches, bebidas, sobremesas. Comece pela primeira."
            action={{ label: 'Nova categoria', onClick: openCreate }}
          />
        </div>
      )}

      {!isLoading && orderedCategories.length > 0 && (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-accent-muted">
                <FolderOpen className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-text">{orderedCategories.length}</p>
                <p className="text-sm text-muted">Categorias</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-success/15">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-text">{activeCount}</p>
                <p className="text-sm text-muted">Visíveis no cardápio</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-gold-muted">
                <Package className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-text">{totalProducts}</p>
                <p className="text-sm text-muted">Produtos nas categorias</p>
              </div>
            </div>
          </div>

          {canReorder ? (
            <div className="mb-4 flex items-start gap-3 rounded-[var(--radius-md)] border border-accent/20 bg-accent-muted/40 px-4 py-3">
              <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-sm text-text">
                Arraste pelo ícone para reordenar. A mesma ordem aparece no cardápio público.
              </p>
            </div>
          ) : (
            <div className="mb-4 rounded-[var(--radius-md)] border border-border bg-elevated/50 px-4 py-3">
              <p className="text-sm text-muted">
                Cadastre pelo menos 2 categorias para poder ordenar.
              </p>
            </div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={orderedCategories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
              disabled={!canReorder}
            >
              <div className="space-y-3">
                {orderedCategories.map((cat, index) => {
                  const count = cat._count?.products ?? 0
                  return (
                    <SortableCategoryCard key={cat.id} category={cat} canDrag={canReorder}>
                      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                        <CategoryCover category={cat} />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display text-[11px] font-medium tracking-[0.16em] text-muted uppercase">
                              {String(index + 1).padStart(2, '0')}
                            </span>
                            <h3 className="font-display text-base font-semibold text-text sm:text-lg">
                              {cat.name}
                            </h3>
                            <Badge variant={cat.isActive ? 'success' : 'muted'}>
                              {cat.isActive ? 'Ativa' : 'Inativa'}
                            </Badge>
                          </div>
                          {cat.description ? (
                            <p className="mt-1 line-clamp-1 text-sm text-muted">{cat.description}</p>
                          ) : (
                            <p className="mt-1 text-sm text-muted/60 italic">Sem descrição</p>
                          )}
                          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-elevated px-2.5 py-1 text-xs text-muted">
                            <Package className="h-3.5 w-3.5" />
                            {productCountLabel(count)}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-0.5 self-end rounded-[var(--radius-md)] bg-elevated/80 p-1 sm:self-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              toggleMutation.mutate({ id: cat.id, isActive: !cat.isActive })
                            }
                            aria-label={cat.isActive ? 'Desativar' : 'Ativar'}
                            title={cat.isActive ? 'Desativar' : 'Ativar'}
                            className={cn(cat.isActive ? 'text-success' : 'text-muted')}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(cat)}
                            aria-label="Editar"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirm(cat)}
                            aria-label="Excluir"
                            title="Excluir"
                            className="text-danger hover:text-danger"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </SortableCategoryCard>
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar categoria' : 'Nova categoria'}
        description="Nome, foto e ordem definem como a seção aparece no cardápio."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <ImageDropzone
            compact
            label="Capa"
            hint="Arraste uma foto ou clique para escolher"
            value={imageUrlValue}
            onChange={(dataUrl) => setValue('imageUrl', dataUrl, { shouldDirty: true })}
            onClear={() => setValue('imageUrl', '', { shouldDirty: true })}
            previewClassName="h-full w-full object-cover"
          />
          <input type="hidden" {...register('imageUrl')} />
          <Input
            label="Nome"
            placeholder="Ex: Lanches, Bebidas, Sobremesas"
            error={errors.name?.message}
            {...register('name')}
          />
          <Textarea
            label="Descrição"
            placeholder="Uma linha que aparece junto da categoria"
            {...register('description')}
          />
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" {...register('isActive')} className="rounded border-border" />
            Categoria ativa no cardápio público
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
