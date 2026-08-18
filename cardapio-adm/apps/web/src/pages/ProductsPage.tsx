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
  Copy,
  Star,
  Package,
  Eye,
  EyeOff,
  GripVertical,
  ImagePlus,
  X,
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
import { TableSkeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/api'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'
import { fileToCompressedDataUrl } from '@/utils/image'

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

function SortableProductCard({
  product,
  canDrag,
  children,
}: {
  product: Product
  canDrag: boolean
  children: ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
    disabled: !canDrag,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:flex-row sm:items-center',
        isDragging && 'z-10 border-accent/40 shadow-lg',
      )}
    >
      {canDrag && (
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none rounded p-1.5 text-muted hover:bg-elevated hover:text-text active:cursor-grabbing"
          aria-label={`Arrastar ${product.name}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  )
}

function ProductPreview({ product }: { product: Product }) {
  const displayPrice = product.promoPrice ?? product.price
  const hasPromo = product.promoPrice != null && product.promoPrice < product.price

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-bg">
      <div className="border-b border-border bg-elevated px-4 py-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Prévia do cardápio
        </p>
      </div>
      <div className="p-4">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="mb-3 h-32 w-full rounded-[var(--radius-md)] object-cover"
          />
        ) : (
          <div className="mb-3 flex h-32 items-center justify-center rounded-[var(--radius-md)] bg-elevated">
            <Package className="h-8 w-8 text-muted/40" />
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium text-text">{product.name || 'Nome do produto'}</h4>
            {product.description && (
              <p className="mt-1 line-clamp-2 text-xs text-muted">{product.description}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            {hasPromo && (
              <p className="text-xs text-muted line-through">
                {formatCurrency(product.price)}
              </p>
            )}
            <p className="font-medium text-accent">{formatCurrency(displayPrice)}</p>
          </div>
        </div>
        {!product.isAvailable && (
          <Badge variant="muted" className="mt-2">Indisponível</Badge>
        )}
      </div>
    </div>
  )
}

export function ProductsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null)
  const [priceEdit, setPriceEdit] = useState<Product | null>(null)
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [orderedProducts, setOrderedProducts] = useState<Product[]>([])
  const [imageBusy, setImageBusy] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
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

  const canReorder = orderedProducts.length > 1

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
    defaultValues: { isAvailable: true, isFeatured: false },
  })

  const watchedValues = watch()
  const imageUrlValue = watchedValues.imageUrl || ''

  const handleImageFile = async (file: File | null) => {
    if (!file) return
    setImageError(null)
    setImageBusy(true)
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      setValue('imageUrl', dataUrl, { shouldDirty: true, shouldValidate: true })
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Erro ao processar a imagem')
    } finally {
      setImageBusy(false)
    }
  }

  const clearImage = () => {
    setImageError(null)
    setValue('imageUrl', '', { shouldDirty: true })
  }

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
    setImageError(null)
    setImageBusy(false)
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

  const previewData: Product = editing || previewProduct || {
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
  }

  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Gerencie os itens do seu cardápio"
        actions={
          <Button onClick={openCreate} disabled={categories.length === 0}>
            <Plus className="h-4 w-4" />
            Novo produto
          </Button>
        }
      />

      <div className="mb-4 space-y-2">
        <Select
          label="Filtrar por categoria"
          options={[{ value: '', label: 'Todas as categorias' }, ...categoryOptions]}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="max-w-xs"
        />
        {canReorder ? (
          <p className="text-xs text-muted">
            Arraste pelo ícone ⋮⋮ para mudar a ordem. A mesma ordem aparece no cardápio público.
          </p>
        ) : (
          <p className="text-xs text-muted">
            Cadastre pelo menos 2 produtos para poder ordenar.
          </p>
        )}
      </div>

      {isLoading && <TableSkeleton rows={6} />}

      {error && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center text-danger">
          Erro ao carregar produtos
        </div>
      )}

      {!isLoading && !error && products.length === 0 && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
          <EmptyState
            icon={Package}
            title="Nenhum produto"
            description="Adicione produtos ao seu cardápio."
            action={
              categories.length > 0
                ? { label: 'Novo produto', onClick: openCreate }
                : undefined
            }
          />
        </div>
      )}

      {!isLoading && orderedProducts.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-3">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={orderedProducts.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
              disabled={!canReorder}
            >
              <div className="space-y-3 lg:col-span-2">
                {orderedProducts.map((product) => (
                  <SortableProductCard key={product.id} product={product} canDrag={canReorder}>
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-16 w-16 shrink-0 rounded-[var(--radius-md)] object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-elevated">
                        <Package className="h-6 w-6 text-muted/40" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-text">{product.name}</h3>
                        {product.isFeatured && (
                          <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-label="Destaque" />
                        )}
                        <Badge variant={product.isAvailable ? 'success' : 'muted'}>
                          {product.isAvailable ? 'Disponível' : 'Indisponível'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted">{product.category?.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        {product.promoPrice != null && product.promoPrice < product.price ? (
                          <>
                            <span className="text-xs text-muted line-through">
                              {formatCurrency(product.price)}
                            </span>
                            <span className="font-medium text-accent">
                              {formatCurrency(product.promoPrice)}
                            </span>
                          </>
                        ) : (
                          <span className="font-medium text-accent">
                            {formatCurrency(product.price)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPreviewProduct(product)}
                        aria-label="Prévia"
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
                        className={cn(product.isFeatured && 'text-accent')}
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
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(product)} aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(product)}
                        aria-label="Excluir"
                        className="text-danger hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </SortableProductCard>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {(previewProduct || modalOpen) && (
            <div className="hidden lg:block">
              <ProductPreview product={modalOpen ? previewData : previewProduct!} />
            </div>
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar produto' : 'Novo produto'}
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
            <div className="space-y-2">
              <p className="text-sm font-medium text-text">Foto do produto</p>
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-border bg-elevated">
                  {imageUrlValue ? (
                    <img
                      src={imageUrlValue}
                      alt="Prévia da foto"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-muted/40" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <label className="inline-flex cursor-pointer">
                    <span className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-3 text-sm text-text hover:border-accent hover:text-accent">
                      <ImagePlus className="h-4 w-4" />
                      {imageBusy ? 'Processando…' : 'Escolher foto'}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      disabled={imageBusy}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null
                        e.target.value = ''
                        void handleImageFile(file)
                      }}
                    />
                  </label>
                  {imageUrlValue && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearImage}>
                      <X className="h-4 w-4" />
                      Remover foto
                    </Button>
                  )}
                  <p className="text-xs text-muted">
                    JPG, PNG ou WEBP. A imagem é otimizada automaticamente.
                  </p>
                  {(imageError || errors.imageUrl?.message) && (
                    <p className="text-xs text-danger" role="alert">
                      {imageError || errors.imageUrl?.message}
                    </p>
                  )}
                </div>
              </div>
              <input type="hidden" {...register('imageUrl')} />
            </div>
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
        open={!!previewProduct && !modalOpen}
        onClose={() => setPreviewProduct(null)}
        title="Prévia do produto"
        size="sm"
      >
        {previewProduct && <ProductPreview product={previewProduct} />}
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
