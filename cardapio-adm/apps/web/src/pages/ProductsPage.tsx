import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
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
  Copy,
  Star,
  Package,
  Eye,
  EyeOff,
  GripVertical,
  Clock,
  Tag,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { productsService } from '@/services/products'
import { categoriesService } from '@/services/categories'
import type { Product } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ImageDropzone } from '@/components/ui/ImageDropzone'
import { ApiError } from '@/services/api'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'

const productSchema = z.object({
  categoryId: z.string().min(1, 'Categoria obrigatória'),
  name: z.string().min(1, 'Nome obrigatório'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Preço inválido'),
  promoPrice: z.coerce.number().min(0).optional().nullable(),
  imageUrl: z.string().optional(),
  internalCode: z.string().optional(),
  prepTimeMinutes: z.coerce.number().optional().nullable(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
})

type ProductForm = z.infer<typeof productSchema>

function hasPromo(product: Pick<Product, 'price' | 'promoPrice'>) {
  return product.promoPrice != null && product.promoPrice < product.price
}

function SortableProductCard({
  product,
  canDrag,
  selected,
  onSelect,
  children,
}: {
  product: Product
  canDrag: boolean
  selected: boolean
  onSelect: () => void
  children: ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
    disabled: !canDrag,
  })
  const promo = hasPromo(product)

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      onClick={onSelect}
      className={cn(
        'relative cursor-pointer overflow-hidden rounded-[var(--radius-lg)] border bg-surface',
        'transition-colors duration-150 hover:border-accent/35 hover:bg-elevated/40',
        selected ? 'border-accent/50 bg-elevated/30' : 'border-border',
        isDragging && 'z-10 border-accent/50 shadow-lg',
        !product.isAvailable && 'opacity-75',
      )}
    >
      <span
        className={cn(
          'absolute inset-y-0 left-0 w-1',
          product.isFeatured ? 'bg-gold' : promo ? 'bg-accent' : 'bg-success',
          !product.isAvailable && 'bg-muted',
        )}
        aria-hidden="true"
      />
      <div className="flex items-center gap-3 p-3 pl-4 sm:gap-4 sm:p-4 sm:pl-5">
        {canDrag && (
          <button
            type="button"
            className="shrink-0 cursor-grab touch-none rounded-[var(--radius-sm)] p-1.5 text-muted hover:bg-elevated hover:text-text active:cursor-grabbing"
            aria-label={`Arrastar ${product.name}`}
            onClick={(e) => e.stopPropagation()}
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

function ProductPreview({ product }: { product: Product }) {
  const displayPrice = product.promoPrice ?? product.price
  const promo = hasPromo(product)

  return (
    <article className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
      <div className="relative aspect-[4/3] bg-elevated">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name || 'Produto'}
            className={cn(
              'h-full w-full object-cover',
              !product.isAvailable && 'grayscale',
            )}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="h-12 w-12 text-muted/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.isFeatured && (
            <span className="inline-flex items-center rounded-[var(--radius-sm)] bg-gold px-2 py-0.5 text-xs font-medium text-bg">
              Destaque
            </span>
          )}
          {promo && <Badge variant="accent">Promo</Badge>}
          {!product.isAvailable && <Badge variant="muted">Indisponível</Badge>}
        </div>
      </div>
      <div className="p-4">
        {product.category?.name && (
          <p className="text-[11px] font-medium tracking-[0.18em] text-gold uppercase">
            {product.category.name}
          </p>
        )}
        <h4 className="mt-1 font-display text-xl font-semibold tracking-tight text-text">
          {product.name || 'Nome do produto'}
        </h4>
        {product.description ? (
          <p className="mt-2 line-clamp-3 text-sm text-muted">{product.description}</p>
        ) : (
          <p className="mt-2 text-sm italic text-muted/50">Sem descrição</p>
        )}
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            {promo && (
              <p className="text-xs text-muted line-through">
                {formatCurrency(product.price)}
              </p>
            )}
            <p className={cn('font-display text-2xl font-semibold', promo ? 'text-gold' : 'text-accent')}>
              {formatCurrency(Number(displayPrice) || 0)}
            </p>
          </div>
          {product.prepTimeMinutes ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <Clock className="h-3.5 w-3.5" />
              {product.prepTimeMinutes} min
            </span>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function ProductsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[4.5rem] w-full rounded-[var(--radius-lg)]" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
        <Skeleton className="hidden h-80 rounded-[var(--radius-lg)] xl:block" />
      </div>
    </div>
  )
}

export function ProductsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null)
  const [priceEdit, setPriceEdit] = useState<Product | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [previewModal, setPreviewModal] = useState<Product | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [orderedProducts, setOrderedProducts] = useState<Product[]>([])
  const queryClient = useQueryClient()

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products', categoryFilter],
    queryFn: () => productsService.list(categoryFilter || undefined),
  })

  useEffect(() => {
    setOrderedProducts(
      [...products].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    )
  }, [products])

  useEffect(() => {
    setSelectedId((current) => {
      if (orderedProducts.length === 0) return null
      if (current && orderedProducts.some((p) => p.id === current)) return current
      return orderedProducts[0].id
    })
  }, [orderedProducts])

  const canReorder = orderedProducts.length > 1
  const selectedProduct = orderedProducts.find((p) => p.id === selectedId) ?? orderedProducts[0]
  const availableCount = orderedProducts.filter((p) => p.isAvailable).length
  const featuredCount = orderedProducts.filter((p) => p.isFeatured).length
  const promoCount = orderedProducts.filter(hasPromo).length

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.list,
  })

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }))

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { isAvailable: true, isFeatured: false, imageUrl: '' },
  })

  const watchedValues = watch()
  const imageUrlValue = watchedValues.imageUrl || ''

  const createMutation = useMutation({
    mutationFn: productsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductForm }) =>
      productsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: productsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setDeleteConfirm(null)
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: productsService.duplicate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      productsService.update(id, { isAvailable }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })

  const featuredMutation = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      productsService.update(id, { isFeatured }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })

  const priceMutation = useMutation({
    mutationFn: ({ id, price, promoPrice }: { id: string; price: number; promoPrice?: number | null }) =>
      productsService.updatePrice(id, { price, promoPrice }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setPriceEdit(null)
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (items: Array<{ id: string; sortOrder: number }>) =>
      productsService.reorder(items),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const handleDragEnd = (event: DragEndEvent) => {
    if (!canReorder) return
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = orderedProducts.findIndex((p) => p.id === active.id)
    const newIndex = orderedProducts.findIndex((p) => p.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const next = arrayMove(orderedProducts, oldIndex, newIndex)
    setOrderedProducts(next)
    reorderMutation.mutate(next.map((p, index) => ({ id: p.id, sortOrder: index })))
  }

  const openCreate = () => {
    setEditing(null)
    reset({
      categoryId: categories[0]?.id || '',
      name: '',
      description: '',
      price: 0,
      promoPrice: null,
      imageUrl: '',
      internalCode: '',
      prepTimeMinutes: null,
      isAvailable: true,
      isFeatured: false,
    })
    setModalOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditing(product)
    reset({
      categoryId: product.categoryId,
      name: product.name,
      description: product.description || '',
      price: product.price,
      promoPrice: product.promoPrice,
      imageUrl: product.imageUrl || '',
      internalCode: product.internalCode || '',
      prepTimeMinutes: product.prepTimeMinutes,
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    reset()
  }

  const onSubmit = async (data: ProductForm) => {
    try {
      const payload = {
        ...data,
        promoPrice: data.promoPrice || null,
        prepTimeMinutes: data.prepTimeMinutes || null,
      }
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: payload })
      } else {
        await createMutation.mutateAsync({
          categoryId: payload.categoryId,
          name: payload.name,
          description: payload.description,
          price: payload.price,
          promoPrice: payload.promoPrice,
          imageUrl: payload.imageUrl,
          internalCode: payload.internalCode,
          prepTimeMinutes: payload.prepTimeMinutes,
          isAvailable: payload.isAvailable,
          isFeatured: payload.isFeatured,
        })
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erro ao salvar'
      setError('root', { message })
    }
  }

  const previewData: Product = editing || {
    id: '',
    establishmentId: '',
    categoryId: watchedValues.categoryId || '',
    name: watchedValues.name || '',
    description: watchedValues.description,
    price: Number(watchedValues.price) || 0,
    promoPrice: watchedValues.promoPrice ? Number(watchedValues.promoPrice) : null,
    imageUrl: watchedValues.imageUrl,
    isAvailable: watchedValues.isAvailable ?? true,
    isFeatured: watchedValues.isFeatured ?? false,
    sortOrder: 0,
    createdAt: '',
    updatedAt: '',
    category: categories.find((c) => c.id === watchedValues.categoryId)
      ? { id: watchedValues.categoryId, name: categories.find((c) => c.id === watchedValues.categoryId)!.name }
      : undefined,
  }

  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Fotos, preço e ordem — do jeito que o cliente vê no cardápio."
        actions={
          <Button onClick={openCreate} disabled={categories.length === 0}>
            <Plus className="h-4 w-4" />
            Novo produto
          </Button>
        }
      />

      {isLoading && <ProductsSkeleton />}

      {error && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center text-danger">
          Erro ao carregar produtos
        </div>
      )}

      {!isLoading && !error && products.length === 0 && (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          <div className="h-1.5 bg-gradient-to-r from-accent via-gold to-success" />
          <EmptyState
            icon={Package}
            title={categories.length === 0 ? 'Falta uma categoria' : 'Nenhum produto ainda'}
            description={
              categories.length === 0
                ? 'Crie uma categoria antes de montar os itens do cardápio.'
                : 'Adicione o primeiro prato, lanche ou bebida. Foto e preço fazem a diferença.'
            }
            action={
              categories.length > 0
                ? { label: 'Novo produto', onClick: openCreate }
                : undefined
            }
          />
          {categories.length === 0 && (
            <div className="pb-10 text-center">
              <Link
                to="/categorias"
                className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
              >
                Ir para categorias <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      {!isLoading && orderedProducts.length > 0 && (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-accent-muted">
                <Package className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-text">{orderedProducts.length}</p>
                <p className="text-sm text-muted">Produtos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-success/15">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-text">{availableCount}</p>
                <p className="text-sm text-muted">Disponíveis</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-gold-muted">
                <Sparkles className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-text">{featuredCount}</p>
                <p className="text-sm text-muted">Destaques</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-accent-muted">
                <Tag className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-text">{promoCount}</p>
                <p className="text-sm text-muted">Em promoção</p>
              </div>
            </div>
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <Select
              label="Filtrar por categoria"
              options={[{ value: '', label: 'Todas as categorias' }, ...categoryOptions]}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="max-w-xs"
            />
            {canReorder ? (
              <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-accent/20 bg-accent-muted/40 px-4 py-3 sm:max-w-md">
                <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p className="text-sm text-text">
                  Arraste pelo ícone para reordenar. A mesma ordem aparece no cardápio público.
                </p>
              </div>
            ) : (
              <p className="rounded-[var(--radius-md)] border border-border bg-elevated/50 px-4 py-3 text-sm text-muted">
                Cadastre pelo menos 2 produtos para poder ordenar.
              </p>
            )}
          </div>

          <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={orderedProducts.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
                disabled={!canReorder}
              >
                <div className="space-y-3">
                  {orderedProducts.map((product) => {
                    const promo = hasPromo(product)
                    return (
                      <SortableProductCard
                        key={product.id}
                        product={product}
                        canDrag={canReorder}
                        selected={selectedId === product.id}
                        onSelect={() => setSelectedId(product.id)}
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt=""
                              className={cn(
                                'h-20 w-20 shrink-0 rounded-[var(--radius-md)] object-cover sm:h-24 sm:w-24',
                                !product.isAvailable && 'grayscale',
                              )}
                            />
                          ) : (
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-elevated sm:h-24 sm:w-24">
                              <Package className="h-7 w-7 text-muted/35" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-display text-base font-semibold text-text sm:text-lg">
                                {product.name}
                              </h3>
                              {product.isFeatured && (
                                <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-label="Destaque" />
                              )}
                              <Badge variant={product.isAvailable ? 'success' : 'muted'}>
                                {product.isAvailable ? 'Disponível' : 'Indisponível'}
                              </Badge>
                              {promo && <Badge variant="accent">Promo</Badge>}
                            </div>
                            <p className="mt-0.5 text-sm text-muted">{product.category?.name}</p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-3">
                              {promo ? (
                                <span className="flex items-baseline gap-2">
                                  <span className="text-xs text-muted line-through">
                                    {formatCurrency(product.price)}
                                  </span>
                                  <span className="font-display text-lg font-semibold text-gold">
                                    {formatCurrency(product.promoPrice!)}
                                  </span>
                                </span>
                              ) : (
                                <span className="font-display text-lg font-semibold text-accent">
                                  {formatCurrency(product.price)}
                                </span>
                              )}
                              {product.prepTimeMinutes ? (
                                <span className="inline-flex items-center gap-1 text-xs text-muted">
                                  <Clock className="h-3.5 w-3.5" />
                                  {product.prepTimeMinutes} min
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div
                            className="flex shrink-0 flex-wrap items-center gap-0.5 self-end rounded-[var(--radius-md)] bg-elevated/80 p-1 sm:self-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="xl:hidden"
                              onClick={() => setPreviewModal(product)}
                              aria-label="Prévia"
                              title="Prévia"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                toggleMutation.mutate({
                                  id: product.id,
                                  isAvailable: !product.isAvailable,
                                })
                              }
                              aria-label={product.isAvailable ? 'Indisponibilizar' : 'Disponibilizar'}
                              title={product.isAvailable ? 'Indisponibilizar' : 'Disponibilizar'}
                            >
                              {product.isAvailable ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                featuredMutation.mutate({
                                  id: product.id,
                                  isFeatured: !product.isFeatured,
                                })
                              }
                              aria-label="Destaque"
                              title="Destaque"
                              className={cn(product.isFeatured && 'text-gold')}
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPriceEdit(product)}
                            >
                              Preço
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => duplicateMutation.mutate(product.id)}
                              aria-label="Duplicar"
                              title="Duplicar"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(product)}
                              aria-label="Editar"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirm(product)}
                              aria-label="Excluir"
                              title="Excluir"
                              className="text-danger hover:text-danger"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </SortableProductCard>
                    )
                  })}
                </div>
              </SortableContext>
            </DndContext>

            {selectedProduct && (
              <div className="sticky top-20 hidden xl:block">
                <p className="mb-2 text-[11px] font-medium tracking-[0.18em] text-muted uppercase">
                  Prévia do cardápio
                </p>
                <ProductPreview product={selectedProduct} />
              </div>
            )}
          </div>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar produto' : 'Novo produto'}
        description="A prévia ao lado mostra como o item aparece no cardápio."
        size="lg"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Select
              label="Categoria"
              options={categoryOptions}
              error={errors.categoryId?.message}
              placeholder="Selecione..."
              {...register('categoryId')}
            />
            <Input label="Nome" error={errors.name?.message} {...register('name')} />
            <Textarea label="Descrição" {...register('description')} />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Preço (R$)"
                type="number"
                step="0.01"
                error={errors.price?.message}
                {...register('price')}
              />
              <Input
                label="Preço promocional"
                type="number"
                step="0.01"
                {...register('promoPrice')}
              />
            </div>
            <ImageDropzone
              compact
              label="Foto"
              hint="Arraste uma foto ou clique para escolher"
              value={imageUrlValue}
              onChange={(dataUrl) => setValue('imageUrl', dataUrl, { shouldDirty: true })}
              onClear={() => setValue('imageUrl', '', { shouldDirty: true })}
              previewClassName="h-full w-full object-cover"
            />
            <input type="hidden" {...register('imageUrl')} />
            <Input label="Código interno" {...register('internalCode')} />
            <Input
              label="Tempo de preparo (min)"
              type="number"
              {...register('prepTimeMinutes')}
            />
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-text">
                <input type="checkbox" {...register('isAvailable')} className="rounded border-border" />
                Disponível
              </label>
              <label className="flex items-center gap-2 text-sm text-text">
                <input type="checkbox" {...register('isFeatured')} className="rounded border-border" />
                Destaque
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
          <ProductPreview product={previewData} />
        </div>
      </Modal>

      <Modal
        open={!!priceEdit}
        onClose={() => setPriceEdit(null)}
        title="Editar preço"
        size="sm"
      >
        {priceEdit && (
          <PriceEditForm
            product={priceEdit}
            onSave={(price, promoPrice) =>
              priceMutation.mutate({ id: priceEdit.id, price, promoPrice })
            }
            isLoading={priceMutation.isPending}
          />
        )}
      </Modal>

      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Excluir produto"
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

      <Modal
        open={!!previewModal}
        onClose={() => setPreviewModal(null)}
        title="Prévia do produto"
        size="sm"
      >
        {previewModal && <ProductPreview product={previewModal} />}
      </Modal>
    </div>
  )
}

function PriceEditForm({
  product,
  onSave,
  isLoading,
}: {
  product: Product
  onSave: (price: number, promoPrice?: number | null) => void
  isLoading: boolean
}) {
  const [price, setPrice] = useState(String(product.price))
  const [promoPrice, setPromoPrice] = useState(
    product.promoPrice != null ? String(product.promoPrice) : '',
  )

  return (
    <div className="space-y-4">
      <Input
        label="Preço (R$)"
        type="number"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <Input
        label="Preço promocional"
        type="number"
        step="0.01"
        value={promoPrice}
        onChange={(e) => setPromoPrice(e.target.value)}
        hint="Deixe vazio para remover promoção"
      />
      <div className="flex justify-end gap-2">
        <Button
          onClick={() =>
            onSave(
              parseFloat(price),
              promoPrice ? parseFloat(promoPrice) : null,
            )
          }
          isLoading={isLoading}
        >
          Salvar preço
        </Button>
      </div>
    </div>
  )
}
