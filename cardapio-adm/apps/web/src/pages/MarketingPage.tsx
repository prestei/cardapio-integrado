import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Megaphone, Image as ImageIcon, Percent, Pause, Play } from 'lucide-react'
import { promotionsService } from '@/services/promotions'
import { bannersService } from '@/services/banners'
import { campaignsService } from '@/services/campaigns'
import type { Banner, Campaign, CreateBannerInput, Promotion, PromotionStatus, PromotionType } from '@/types'
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

type TabId = 'promocoes' | 'banners' | 'campanhas'

const TABS: { id: TabId; label: string }[] = [
  { id: 'promocoes', label: 'Promoções' },
  { id: 'banners', label: 'Banners' },
  { id: 'campanhas', label: 'Campanhas' },
]

function toIsoOrNull(value?: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function MarketingPage() {
  const [tab, setTab] = useState<TabId>('promocoes')

  return (
    <div>
      <PageHeader
        title="Marketing"
        description="Promoções, banners e campanhas para atrair e reter clientes"
      />

      <div
        role="tablist"
        aria-label="Seções de marketing"
        className="mb-6 flex flex-wrap gap-1 rounded-[var(--radius-md)] border border-border bg-surface p-1"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              'rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              tab === id ? 'bg-accent-muted text-accent font-medium' : 'text-muted hover:text-text',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'promocoes' && <PromotionsTab />}
      {tab === 'banners' && <BannersTab />}
      {tab === 'campanhas' && <CampaignsTab />}
    </div>
  )
}

const PROMOTION_TYPE_OPTIONS: { value: PromotionType; label: string }[] = [
  { value: 'PERCENTAGE', label: 'Desconto percentual' },
  { value: 'FIXED', label: 'Desconto fixo' },
  { value: 'PROMO_PRICE', label: 'Preço promocional' },
  { value: 'BUY_X_GET_Y', label: 'Leve X, pague Y' },
  { value: 'COMBO', label: 'Combo' },
  { value: 'FREE_DELIVERY', label: 'Entrega grátis' },
  { value: 'CATEGORY', label: 'Por categoria' },
  { value: 'PRODUCT', label: 'Por produto' },
]

const STATUS_OPTIONS: { value: PromotionStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'ACTIVE', label: 'Ativa' },
  { value: 'PAUSED', label: 'Pausada' },
  { value: 'ENDED', label: 'Encerrada' },
  { value: 'ARCHIVED', label: 'Arquivada' },
]

const promotionTypeLabels = Object.fromEntries(
  PROMOTION_TYPE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<PromotionType, string>

const promotionSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  description: z.string().optional(),
  type: z.enum([
    'PERCENTAGE',
    'FIXED',
    'PROMO_PRICE',
    'BUY_X_GET_Y',
    'COMBO',
    'FREE_DELIVERY',
    'CATEGORY',
    'PRODUCT',
  ]),
  value: z.coerce.number().min(0).optional(),
  buyQuantity: z.coerce.number().int().positive().optional().or(z.literal('')),
  getQuantity: z.coerce.number().int().positive().optional().or(z.literal('')),
  imageUrl: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  usageLimit: z.coerce.number().int().positive().optional().or(z.literal('')),
  priority: z.coerce.number().int().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED', 'ARCHIVED']),
  isActive: z.boolean().optional(),
})

type PromotionForm = z.infer<typeof promotionSchema>

function PromotionsTab() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Promotion | null>(null)

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: () => promotionsService.list(),
  })

  const form = useForm<PromotionForm>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      name: '',
      type: 'PERCENTAGE',
      value: 0,
      status: 'DRAFT',
      isActive: true,
    },
  })

  const selectedType = form.watch('type')

  const openCreate = () => {
    setEditing(null)
    form.reset({
      name: '',
      description: '',
      type: 'PERCENTAGE',
      value: 0,
      status: 'DRAFT',
      isActive: true,
      imageUrl: '',
      startsAt: '',
      endsAt: '',
      startTime: '',
      endTime: '',
    })
    setModalOpen(true)
  }

  const openEdit = (promo: Promotion) => {
    setEditing(promo)
    form.reset({
      name: promo.name,
      description: promo.description ?? '',
      type: promo.type,
      value: Number(promo.value),
      buyQuantity: promo.buyQuantity ?? undefined,
      getQuantity: promo.getQuantity ?? undefined,
      imageUrl: promo.imageUrl ?? '',
      startsAt: promo.startsAt ? promo.startsAt.slice(0, 16) : '',
      endsAt: promo.endsAt ? promo.endsAt.slice(0, 16) : '',
      startTime: promo.startTime ?? '',
      endTime: promo.endTime ?? '',
      usageLimit: promo.usageLimit ?? undefined,
      priority: promo.priority ?? 0,
      status: promo.status,
      isActive: promo.isActive,
    })
    setModalOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: async (data: PromotionForm) => {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        type: data.type,
        value: Number(data.value ?? 0),
        buyQuantity:
          data.buyQuantity === '' || data.buyQuantity == null ? null : Number(data.buyQuantity),
        getQuantity:
          data.getQuantity === '' || data.getQuantity == null ? null : Number(data.getQuantity),
        imageUrl: data.imageUrl || undefined,
        startsAt: toIsoOrNull(data.startsAt),
        endsAt: toIsoOrNull(data.endsAt),
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        usageLimit:
          data.usageLimit === '' || data.usageLimit == null ? null : Number(data.usageLimit),
        priority: data.priority,
        status: data.status,
        isActive: data.isActive ?? true,
      }
      if (editing) return promotionsService.update(editing.id, payload)
      return promotionsService.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] })
      setModalOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => promotionsService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promotions'] }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PromotionStatus }) =>
      promotionsService.update(id, { status, isActive: status === 'ACTIVE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promotions'] }),
  })

  const onSubmit = async (data: PromotionForm) => {
    try {
      await saveMutation.mutateAsync(data)
    } catch (err) {
      form.setError('root', { message: err instanceof ApiError ? err.message : 'Erro ao salvar' })
    }
  }

  if (isLoading) return <TableSkeleton rows={5} />

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          Nova promoção
        </Button>
      </div>

      {promotions.length === 0 ? (
        <EmptyState
          icon={Percent}
          title="Nenhuma promoção"
          description="Crie descontos, combos e campanhas promocionais."
          action={{ label: 'Criar promoção', onClick: openCreate }}
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-elevated text-left text-muted">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((p) => (
                <tr key={p.id} className="border-b border-border/50">
                  <td className="px-4 py-3 text-text">{p.name}</td>
                  <td className="px-4 py-3 text-muted">{promotionTypeLabels[p.type]}</td>
                  <td className="px-4 py-3 text-text">
                    {p.type === 'PERCENTAGE'
                      ? `${Number(p.value)}%`
                      : p.type === 'FREE_DELIVERY'
                        ? 'Grátis'
                        : formatCurrency(Number(p.value))}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={p.status === 'ACTIVE' ? 'success' : 'muted'}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {p.status === 'ACTIVE' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="Pausar promoção"
                          onClick={() => statusMutation.mutate({ id: p.id, status: 'PAUSED' })}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="Ativar promoção"
                          onClick={() => statusMutation.mutate({ id: p.id, status: 'ACTIVE' })}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" aria-label="Editar" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label="Excluir"
                        onClick={() => {
                          if (confirm('Excluir esta promoção?')) deleteMutation.mutate(p.id)
                        }}
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
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar promoção' : 'Nova promoção'}
        size="lg"
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <Input label="Nome" className="sm:col-span-2" error={form.formState.errors.name?.message} {...form.register('name')} />
          <Textarea label="Descrição" className="sm:col-span-2" {...form.register('description')} />
          <Select label="Tipo" options={PROMOTION_TYPE_OPTIONS} {...form.register('type')} />
          <Select label="Status" options={STATUS_OPTIONS} {...form.register('status')} />
          {selectedType !== 'FREE_DELIVERY' && selectedType !== 'BUY_X_GET_Y' && (
            <Input label="Valor" type="number" step="0.01" {...form.register('value')} />
          )}
          {selectedType === 'BUY_X_GET_Y' && (
            <>
              <Input label="Leve (X)" type="number" {...form.register('buyQuantity')} />
              <Input label="Pague (Y)" type="number" {...form.register('getQuantity')} />
            </>
          )}
          <Input label="Início" type="datetime-local" {...form.register('startsAt')} />
          <Input label="Fim" type="datetime-local" {...form.register('endsAt')} />
          <Input label="Horário inicial" type="time" {...form.register('startTime')} />
          <Input label="Horário final" type="time" {...form.register('endTime')} />
          <Input label="Limite de uso" type="number" {...form.register('usageLimit')} />
          <Input label="Prioridade" type="number" {...form.register('priority')} />
          <Input label="URL da imagem" className="sm:col-span-2" {...form.register('imageUrl')} />
          {form.formState.errors.root && (
            <p className="sm:col-span-2 text-sm text-danger" role="alert">
              {form.formState.errors.root.message}
            </p>
          )}
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={form.formState.isSubmitting}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

const bannerSchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  subtitle: z.string().optional(),
  imageUrl: z.string().url('URL inválida'),
  buttonLabel: z.string().optional(),
  linkUrl: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  sortOrder: z.coerce.number().int().optional(),
  showDesktop: z.boolean().optional(),
  showMobile: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

type BannerForm = z.infer<typeof bannerSchema>

function BannersTab() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: () => bannersService.list(),
  })

  const form = useForm<BannerForm>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: '',
      imageUrl: '',
      showDesktop: true,
      showMobile: true,
      isActive: true,
      sortOrder: 0,
    },
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({
      title: '',
      subtitle: '',
      imageUrl: '',
      buttonLabel: '',
      linkUrl: '',
      showDesktop: true,
      showMobile: true,
      isActive: true,
      sortOrder: 0,
    })
    setModalOpen(true)
  }

  const openEdit = (banner: Banner) => {
    setEditing(banner)
    form.reset({
      title: banner.title,
      subtitle: banner.subtitle ?? '',
      imageUrl: banner.imageUrl,
      buttonLabel: banner.buttonLabel ?? '',
      linkUrl: banner.linkUrl ?? '',
      startsAt: banner.startsAt ? banner.startsAt.slice(0, 16) : '',
      endsAt: banner.endsAt ? banner.endsAt.slice(0, 16) : '',
      sortOrder: banner.sortOrder,
      showDesktop: banner.showDesktop,
      showMobile: banner.showMobile,
      isActive: banner.isActive,
    })
    setModalOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: async (data: BannerForm) => {
      const payload: CreateBannerInput = {
        title: data.title,
        subtitle: data.subtitle,
        imageUrl: data.imageUrl,
        buttonLabel: data.buttonLabel,
        linkUrl: data.linkUrl,
        sortOrder: data.sortOrder,
        showDesktop: data.showDesktop,
        showMobile: data.showMobile,
        isActive: data.isActive,
        startsAt: toIsoOrNull(data.startsAt),
        endsAt: toIsoOrNull(data.endsAt),
      }
      if (editing) return bannersService.update(editing.id, payload)
      return bannersService.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] })
      setModalOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bannersService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['banners'] }),
  })

  const onSubmit = async (data: BannerForm) => {
    try {
      await saveMutation.mutateAsync(data)
    } catch (err) {
      form.setError('root', { message: err instanceof ApiError ? err.message : 'Erro ao salvar' })
    }
  }

  if (isLoading) return <TableSkeleton rows={4} />

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          Novo banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Nenhum banner"
          description="Adicione banners para o cardápio público."
          action={{ label: 'Criar banner', onClick: openCreate }}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banners.map((b) => (
            <li key={b.id} className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
              <img src={b.imageUrl} alt={b.title} className="h-36 w-full object-cover" />
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-text">{b.title}</p>
                    {b.subtitle && <p className="text-xs text-muted">{b.subtitle}</p>}
                  </div>
                  <Badge variant={b.isActive ? 'success' : 'muted'}>
                    {b.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <p className="text-xs text-muted">
                  Ordem {b.sortOrder} · Desktop {b.showDesktop ? 'sim' : 'não'} · Mobile{' '}
                  {b.showMobile ? 'sim' : 'não'}
                </p>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(b)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm('Excluir este banner?')) deleteMutation.mutate(b.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar banner' : 'Novo banner'}
        size="lg"
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <Input label="Título" className="sm:col-span-2" error={form.formState.errors.title?.message} {...form.register('title')} />
          <Input label="Subtítulo" className="sm:col-span-2" {...form.register('subtitle')} />
          <Input label="URL da imagem" className="sm:col-span-2" error={form.formState.errors.imageUrl?.message} {...form.register('imageUrl')} />
          <Input label="Texto do botão" {...form.register('buttonLabel')} />
          <Input label="Link" {...form.register('linkUrl')} />
          <Input label="Início" type="datetime-local" {...form.register('startsAt')} />
          <Input label="Fim" type="datetime-local" {...form.register('endsAt')} />
          <Input label="Ordem" type="number" {...form.register('sortOrder')} />
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" {...form.register('showDesktop')} className="rounded border-border" />
            Exibir no desktop
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" {...form.register('showMobile')} className="rounded border-border" />
            Exibir no mobile
          </label>
          <label className="flex items-center gap-2 text-sm text-text sm:col-span-2">
            <input type="checkbox" {...form.register('isActive')} className="rounded border-border" />
            Ativo
          </label>
          {form.formState.errors.root && (
            <p className="sm:col-span-2 text-sm text-danger" role="alert">
              {form.formState.errors.root.message}
            </p>
          )}
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={form.formState.isSubmitting}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

const campaignSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  objective: z.string().optional(),
  segment: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'ENDED']),
  isActive: z.boolean().optional(),
})

type CampaignForm = z.infer<typeof campaignSchema>

function CampaignsTab() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsService.list(),
  })

  const form = useForm<CampaignForm>({
    resolver: zodResolver(campaignSchema),
    defaultValues: { name: '', status: 'DRAFT', isActive: true },
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({ name: '', objective: '', segment: '', status: 'DRAFT', isActive: true })
    setModalOpen(true)
  }

  const openEdit = (campaign: Campaign) => {
    setEditing(campaign)
    form.reset({
      name: campaign.name,
      objective: campaign.objective ?? '',
      segment: campaign.segment ?? '',
      startsAt: campaign.startsAt ? campaign.startsAt.slice(0, 16) : '',
      endsAt: campaign.endsAt ? campaign.endsAt.slice(0, 16) : '',
      status: (campaign.status as CampaignForm['status']) || 'DRAFT',
      isActive: campaign.isActive,
    })
    setModalOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: async (data: CampaignForm) => {
      const payload = {
        name: data.name,
        objective: data.objective || undefined,
        segment: data.segment || undefined,
        startsAt: toIsoOrNull(data.startsAt),
        endsAt: toIsoOrNull(data.endsAt),
        status: data.status,
        isActive: data.isActive ?? true,
      }
      if (editing) return campaignsService.update(editing.id, payload)
      return campaignsService.create(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      setModalOpen(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignsService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  })

  const onSubmit = async (data: CampaignForm) => {
    try {
      await saveMutation.mutateAsync(data)
    } catch (err) {
      form.setError('root', { message: err instanceof ApiError ? err.message : 'Erro ao salvar' })
    }
  }

  const metricsHint = useMemo(
    () => 'Métricas reais (visualizações, cliques, pedidos) só aparecem quando houver dados registrados.',
    [],
  )

  if (isLoading) return <TableSkeleton rows={4} />

  return (
    <div>
      <p className="mb-4 text-sm text-muted">{metricsHint}</p>
      <div className="mb-4 flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden />
          Nova campanha
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Nenhuma campanha"
          description="Agrupe banners e promoções em campanhas com objetivo e período."
          action={{ label: 'Criar campanha', onClick: openCreate }}
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-elevated text-left text-muted">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Objetivo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Métricas</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="px-4 py-3 text-text">{c.name}</td>
                  <td className="px-4 py-3 text-muted">{c.objective || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.status === 'ACTIVE' ? 'success' : 'muted'}>{c.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {c.views ?? 0} views · {c.clicks ?? 0} cliques · {c.ordersCount ?? 0} pedidos
                    {(c.views ?? 0) === 0 && (c.clicks ?? 0) === 0 ? ' (sem base ainda)' : ''}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm('Excluir esta campanha?')) deleteMutation.mutate(c.id)
                        }}
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
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar campanha' : 'Nova campanha'}
        size="lg"
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <Input label="Nome" className="sm:col-span-2" error={form.formState.errors.name?.message} {...form.register('name')} />
          <Textarea label="Objetivo" className="sm:col-span-2" {...form.register('objective')} />
          <Input label="Segmento" className="sm:col-span-2" {...form.register('segment')} />
          <Input label="Início" type="datetime-local" {...form.register('startsAt')} />
          <Input label="Fim" type="datetime-local" {...form.register('endsAt')} />
          <Select
            label="Status"
            options={[
              { value: 'DRAFT', label: 'Rascunho' },
              { value: 'ACTIVE', label: 'Ativa' },
              { value: 'PAUSED', label: 'Pausada' },
              { value: 'ENDED', label: 'Encerrada' },
            ]}
            {...form.register('status')}
          />
          {form.formState.errors.root && (
            <p className="sm:col-span-2 text-sm text-danger" role="alert">
              {form.formState.errors.root.message}
            </p>
          )}
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={form.formState.isSubmitting}>
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
