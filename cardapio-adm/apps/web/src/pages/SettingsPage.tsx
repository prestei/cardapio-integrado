import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  Palette,
  Clock,
  UtensilsCrossed,
  Wallet,
  Globe,
  ScrollText,
  Copy,
  ExternalLink,
  Check,
  Bell,
} from 'lucide-react'
import { establishmentService } from '@/services/establishment'
import { settingsService } from '@/services/settings'
import { notificationSettingsService } from '@/services/notificationSettings'
import type { BusinessHours, Establishment, EstablishmentSettings } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/api'
import { cn } from '@/utils/cn'

type TabId =
  | 'gerais'
  | 'identidade'
  | 'horarios'
  | 'atendimento'
  | 'pedido-minimo'
  | 'notificacoes'
  | 'dominio'
  | 'politicas'

const TABS: { id: TabId; label: string; icon: typeof Building2 }[] = [
  { id: 'gerais', label: 'Gerais', icon: Building2 },
  { id: 'identidade', label: 'Identidade', icon: Palette },
  { id: 'horarios', label: 'Horários', icon: Clock },
  { id: 'atendimento', label: 'Atendimento', icon: UtensilsCrossed },
  { id: 'pedido-minimo', label: 'Pedido mínimo', icon: Wallet },
  { id: 'notificacoes', label: 'Notificações', icon: Bell },
  { id: 'dominio', label: 'Domínio', icon: Globe },
  { id: 'politicas', label: 'Políticas', icon: ScrollText },
]

export function SettingsPage() {
  const [tab, setTab] = useState<TabId>('gerais')

  const { data: establishment, isLoading: loadingEstablishment } = useQuery({
    queryKey: ['establishment'],
    queryFn: establishmentService.get,
  })

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['establishment-settings'],
    queryFn: settingsService.getSettings,
  })

  const { data: hours, isLoading: loadingHours } = useQuery({
    queryKey: ['establishment-hours'],
    queryFn: settingsService.getHours,
  })

  const isLoading = loadingEstablishment || loadingSettings || loadingHours

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Configure seu estabelecimento"
      />

      <div className="mb-6 flex flex-wrap gap-1 rounded-[var(--radius-md)] border border-border bg-surface p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors',
              tab === id ? 'bg-accent-muted text-accent font-medium' : 'text-muted hover:text-text',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {!isLoading && establishment && settings && hours && (
        <>
          {tab === 'gerais' && <GeneralTab establishment={establishment} />}
          {tab === 'identidade' && <IdentityTab establishment={establishment} />}
          {tab === 'horarios' && <HoursTab hours={hours} />}
          {tab === 'atendimento' && <ServiceTab establishment={establishment} settings={settings} />}
          {tab === 'pedido-minimo' && <MinOrderTab settings={settings} />}
          {tab === 'notificacoes' && <NotificationsTab settings={settings} />}
          {tab === 'dominio' && <DomainTab establishment={establishment} settings={settings} />}
          {tab === 'politicas' && <PoliciesTab settings={settings} />}
        </>
      )}
    </div>
  )
}

function SaveBar({
  isSubmitting,
  errorMessage,
}: {
  isSubmitting: boolean
  errorMessage?: string
}) {
  return (
    <div className="flex items-center justify-between border-t border-border pt-4">
      <p className="text-sm text-danger">{errorMessage}</p>
      <Button type="submit" isLoading={isSubmitting} className="ml-auto">
        Salvar alterações
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Gerais
// ---------------------------------------------------------------------------

const generalSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  displayName: z.string().optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  cnpj: z.string().optional(),
  isOpen: z.boolean().optional(),
})

type GeneralForm = z.infer<typeof generalSchema>

function GeneralTab({ establishment }: { establishment: Establishment }) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GeneralForm>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      name: establishment.name,
      displayName: establishment.displayName || '',
      description: establishment.description || '',
      phone: establishment.phone || '',
      whatsapp: establishment.whatsapp || '',
      email: establishment.email || '',
      address: establishment.address || '',
      city: establishment.city || '',
      state: establishment.state || '',
      zipCode: establishment.zipCode || '',
      cnpj: establishment.cnpj || '',
      isOpen: establishment.isOpen,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: GeneralForm) => establishmentService.update(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['establishment'] }),
  })

  const onSubmit = async (data: GeneralForm) => {
    try {
      await mutation.mutateAsync({ ...data, email: data.email || undefined })
    } catch (err) {
      setError('root', { message: err instanceof ApiError ? err.message : 'Erro ao salvar' })
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome do estabelecimento" error={errors.name?.message} {...register('name')} />
        <Input label="Nome de exibição" hint="Usado no cardápio público" {...register('displayName')} />
      </div>
      <Textarea label="Descrição" {...register('description')} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Telefone" {...register('phone')} />
        <Input label="WhatsApp" {...register('whatsapp')} />
        <Input label="E-mail" type="email" error={errors.email?.message} {...register('email')} />
      </div>
      <Input label="Endereço" {...register('address')} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Cidade" {...register('city')} />
        <Input label="Estado (UF)" maxLength={2} {...register('state')} />
        <Input label="CEP" {...register('zipCode')} />
      </div>
      <Input label="CNPJ" {...register('cnpj')} />
      <label className="flex items-center gap-2 text-sm text-text">
        <input type="checkbox" {...register('isOpen')} className="rounded border-border" />
        Estabelecimento aberto para pedidos
      </label>
      <SaveBar isSubmitting={isSubmitting} errorMessage={errors.root?.message} />
    </form>
  )
}

// ---------------------------------------------------------------------------
// Identidade
// ---------------------------------------------------------------------------

const identitySchema = z.object({
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  primaryColor: z.string().min(1),
  secondaryColor: z.string().min(1),
  accentColor: z.string().optional(),
})

type IdentityForm = z.infer<typeof identitySchema>

function IdentityTab({ establishment }: { establishment: Establishment }) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<IdentityForm>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      logoUrl: establishment.logoUrl || '',
      bannerUrl: establishment.bannerUrl || '',
      primaryColor: establishment.primaryColor,
      secondaryColor: establishment.secondaryColor,
      accentColor: establishment.accentColor || establishment.primaryColor,
    },
  })

  const values = watch()

  const mutation = useMutation({
    mutationFn: (data: IdentityForm) => establishmentService.update(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['establishment'] }),
  })

  const onSubmit = async (data: IdentityForm) => {
    try {
      await mutation.mutateAsync(data)
    } catch (err) {
      setError('root', { message: err instanceof ApiError ? err.message : 'Erro ao salvar' })
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5"
      >
        <Input label="URL do logo" {...register('logoUrl')} />
        <Input label="URL do banner" {...register('bannerUrl')} />
        <div className="grid grid-cols-3 gap-3">
          <ColorInput label="Cor primária" registration={register('primaryColor')} />
          <ColorInput label="Cor secundária" registration={register('secondaryColor')} />
          <ColorInput label="Cor de destaque" registration={register('accentColor')} />
        </div>
        <SaveBar isSubmitting={isSubmitting} errorMessage={errors.root?.message} />
      </form>

      <div className="rounded-[var(--radius-lg)] border border-border bg-bg">
        <div className="border-b border-border bg-elevated px-4 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Prévia</p>
        </div>
        <div className="p-5">
          {values.bannerUrl ? (
            <img src={values.bannerUrl} alt="Banner" className="mb-3 h-24 w-full rounded-[var(--radius-md)] object-cover" />
          ) : (
            <div
              className="mb-3 h-24 w-full rounded-[var(--radius-md)]"
              style={{ background: `linear-gradient(135deg, ${values.primaryColor}, ${values.secondaryColor})` }}
            />
          )}
          <div className="flex items-center gap-3">
            {values.logoUrl ? (
              <img src={values.logoUrl} alt="Logo" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full font-display text-lg font-semibold text-white"
                style={{ backgroundColor: values.primaryColor }}
              >
                {establishment.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-display font-medium text-text">{establishment.name}</p>
              <p className="text-xs text-muted">Cardápio digital</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <span
              className="rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium text-white"
              style={{ backgroundColor: values.primaryColor }}
            >
              Botão primário
            </span>
            <span
              className="rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium text-white"
              style={{ backgroundColor: values.accentColor || values.primaryColor }}
            >
              Destaque
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ColorInput({
  label,
  registration,
}: {
  label: string
  registration: ReturnType<ReturnType<typeof useForm<IdentityForm>>['register']>
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" className="h-10 w-10 shrink-0 cursor-pointer rounded-[var(--radius-sm)] border border-border bg-surface" {...registration} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Horários
// ---------------------------------------------------------------------------

const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

function buildDefaultHours(existing: BusinessHours[]): BusinessHours[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => {
    const found = existing.find((h) => h.dayOfWeek === dayOfWeek)
    return (
      found || {
        dayOfWeek,
        openTime: '08:00',
        closeTime: '18:00',
        breakStart: '',
        breakEnd: '',
        isClosed: dayOfWeek === 0,
      }
    )
  })
}

function HoursTab({ hours }: { hours: BusinessHours[] }) {
  const queryClient = useQueryClient()
  const [days, setDays] = useState<BusinessHours[]>(() => buildDefaultHours(hours))
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDays(buildDefaultHours(hours))
  }, [hours])

  const mutation = useMutation({
    mutationFn: (data: BusinessHours[]) => settingsService.updateHours(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['establishment-hours'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
  })

  const updateDay = (index: number, patch: Partial<BusinessHours>) => {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)))
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
        <ul className="divide-y divide-border">
          {days.map((day, index) => (
            <li key={day.dayOfWeek} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex w-32 shrink-0 items-center gap-2">
                <label className="flex items-center gap-2 text-sm font-medium text-text">
                  <input
                    type="checkbox"
                    checked={!day.isClosed}
                    onChange={(e) => updateDay(index, { isClosed: !e.target.checked })}
                    className="rounded border-border"
                  />
                  {WEEKDAY_LABELS[day.dayOfWeek]}
                </label>
              </div>

              {day.isClosed ? (
                <span className="text-sm text-muted">Fechado</span>
              ) : (
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted">Período 1</span>
                  <input
                    type="time"
                    value={day.openTime || ''}
                    onChange={(e) => updateDay(index, { openTime: e.target.value })}
                    className="h-9 rounded-[var(--radius-sm)] border border-border bg-elevated px-2 text-sm text-text"
                  />
                  <span className="text-muted">até</span>
                  <input
                    type="time"
                    value={day.closeTime || ''}
                    onChange={(e) => updateDay(index, { closeTime: e.target.value })}
                    className="h-9 rounded-[var(--radius-sm)] border border-border bg-elevated px-2 text-sm text-text"
                  />

                  <span className="ml-3 text-xs uppercase tracking-wide text-muted">
                    Período 2 (opcional)
                  </span>
                  <input
                    type="time"
                    value={day.breakStart || ''}
                    onChange={(e) => updateDay(index, { breakStart: e.target.value })}
                    className="h-9 rounded-[var(--radius-sm)] border border-border bg-elevated px-2 text-sm text-text"
                  />
                  <span className="text-muted">até</span>
                  <input
                    type="time"
                    value={day.breakEnd || ''}
                    onChange={(e) => updateDay(index, { breakEnd: e.target.value })}
                    className="h-9 rounded-[var(--radius-sm)] border border-border bg-elevated px-2 text-sm text-text"
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1 text-sm text-success">
            <Check className="h-4 w-4" /> Horários salvos
          </span>
        )}
        <Button isLoading={mutation.isPending} onClick={() => mutation.mutate(days)}>
          Salvar horários
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Atendimento / modalidades / pagamentos
// ---------------------------------------------------------------------------

const serviceSchema = z.object({
  acceptDelivery: z.boolean().optional(),
  acceptPickup: z.boolean().optional(),
  acceptDineIn: z.boolean().optional(),
  acceptCash: z.boolean().optional(),
  acceptPix: z.boolean().optional(),
  acceptCard: z.boolean().optional(),
  acceptOnline: z.boolean().optional(),
  allowScheduledOrders: z.boolean().optional(),
  scheduleMinLeadMinutes: z.coerce.number().min(0).optional(),
  scheduleSlotIntervalMinutes: z.coerce.number().min(5).optional().nullable(),
  scheduleMaxOrdersPerSlot: z.coerce.number().min(1).optional().nullable(),
  scheduleMaxDaysAhead: z.coerce.number().min(1).optional().nullable(),
  estimatedMinutes: z.coerce.number().min(0).optional().nullable(),
})

type ServiceForm = z.infer<typeof serviceSchema>

function ServiceTab({
  settings,
}: {
  establishment: Establishment
  settings: EstablishmentSettings
}) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      acceptDelivery: settings.acceptDelivery,
      acceptPickup: settings.acceptPickup,
      acceptDineIn: settings.acceptDineIn,
      acceptCash: settings.acceptCash,
      acceptPix: settings.acceptPix,
      acceptCard: settings.acceptCard,
      acceptOnline: settings.acceptOnline,
      allowScheduledOrders: settings.allowScheduledOrders,
      scheduleMinLeadMinutes: settings.scheduleMinLeadMinutes,
      scheduleSlotIntervalMinutes: settings.scheduleSlotIntervalMinutes ?? 30,
      scheduleMaxOrdersPerSlot: settings.scheduleMaxOrdersPerSlot,
      scheduleMaxDaysAhead: settings.scheduleMaxDaysAhead ?? 7,
      estimatedMinutes: settings.estimatedMinutes,
    },
  })

  const allowScheduled = watch('allowScheduledOrders')

  const mutation = useMutation({
    mutationFn: (data: ServiceForm) => settingsService.updateSettings(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['establishment-settings'] }),
  })

  const onSubmit = async (data: ServiceForm) => {
    try {
      await mutation.mutateAsync(data)
    } catch (err) {
      setError('root', { message: err instanceof ApiError ? err.message : 'Erro ao salvar' })
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-[var(--radius-lg)] border border-border bg-surface p-5"
    >
      <div>
        <h3 className="mb-3 text-sm font-medium text-text">Modalidades de pedido</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" {...register('acceptDelivery')} className="rounded border-border" />
            Delivery
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" {...register('acceptPickup')} className="rounded border-border" />
            Retirada
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" {...register('acceptDineIn')} className="rounded border-border" />
            Salão
          </label>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-text">Formas de pagamento</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" {...register('acceptCash')} className="rounded border-border" />
            Dinheiro
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" {...register('acceptPix')} className="rounded border-border" />
            Pix
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" {...register('acceptCard')} className="rounded border-border" />
            Cartão
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" {...register('acceptOnline')} className="rounded border-border" />
            Pagamento online
          </label>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-text">Agendamento e preparo</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Tempo estimado de preparo (min)" type="number" {...register('estimatedMinutes')} />
          <label className="flex items-center gap-2 self-end text-sm text-text pb-2.5">
            <input type="checkbox" {...register('allowScheduledOrders')} className="rounded border-border" />
            Permitir pedidos agendados
          </label>
        </div>
        {allowScheduled && (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              label="Antecedência mínima (min)"
              type="number"
              {...register('scheduleMinLeadMinutes')}
            />
            <Input
              label="Intervalo entre horários (min)"
              type="number"
              min={5}
              step={5}
              hint="Ex.: 30 = horários a cada 30 minutos"
              {...register('scheduleSlotIntervalMinutes')}
            />
            <Input
              label="Máx. de pedidos por horário"
              type="number"
              min={1}
              hint="Deixe vazio para ilimitado"
              {...register('scheduleMaxOrdersPerSlot')}
            />
            <Input
              label="Agendar com até (dias)"
              type="number"
              min={1}
              {...register('scheduleMaxDaysAhead')}
            />
          </div>
        )}
      </div>

      <SaveBar isSubmitting={isSubmitting} errorMessage={errors.root?.message} />
    </form>
  )
}

// ---------------------------------------------------------------------------
// Pedido mínimo
// ---------------------------------------------------------------------------

const minOrderSchema = z.object({
  deliveryFeeType: z.enum(['FIXED', 'ZONE']),
  fixedDeliveryFee: z.coerce.number().min(0).optional().nullable(),
  minOrderValue: z.coerce.number().min(0).optional().nullable(),
  minOrderDelivery: z.coerce.number().min(0).optional().nullable(),
  minOrderMessage: z.string().optional(),
  freeDeliveryAbove: z.coerce.number().min(0).optional().nullable(),
  deliveryRadiusKm: z.coerce.number().min(0).optional().nullable(),
})

type MinOrderForm = z.infer<typeof minOrderSchema>

const DELIVERY_FEE_TYPE_OPTIONS = [
  { value: 'FIXED', label: 'Taxa fixa' },
  { value: 'ZONE', label: 'Por zona de entrega' },
]

function MinOrderTab({ settings }: { settings: EstablishmentSettings }) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MinOrderForm>({
    resolver: zodResolver(minOrderSchema),
    defaultValues: {
      deliveryFeeType: settings.deliveryFeeType,
      fixedDeliveryFee: settings.fixedDeliveryFee,
      minOrderValue: settings.minOrderValue,
      minOrderDelivery: settings.minOrderDelivery,
      minOrderMessage: settings.minOrderMessage || '',
      freeDeliveryAbove: settings.freeDeliveryAbove,
      deliveryRadiusKm: settings.deliveryRadiusKm,
    },
  })

  const feeType = watch('deliveryFeeType')

  const mutation = useMutation({
    mutationFn: (data: MinOrderForm) => settingsService.updateSettings(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['establishment-settings'] }),
  })

  const onSubmit = async (data: MinOrderForm) => {
    try {
      await mutation.mutateAsync(data)
    } catch (err) {
      setError('root', { message: err instanceof ApiError ? err.message : 'Erro ao salvar' })
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Pedido mínimo geral (R$)" type="number" step="0.01" {...register('minOrderValue')} />
        <Input label="Pedido mínimo para delivery (R$)" type="number" step="0.01" {...register('minOrderDelivery')} />
      </div>
      <Textarea
        label="Mensagem de pedido mínimo"
        placeholder="Exibida ao cliente quando o pedido não atinge o mínimo"
        {...register('minOrderMessage')}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Tipo de taxa de entrega" options={DELIVERY_FEE_TYPE_OPTIONS} {...register('deliveryFeeType')} />
        {feeType === 'FIXED' && (
          <Input label="Taxa fixa de entrega (R$)" type="number" step="0.01" {...register('fixedDeliveryFee')} />
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Frete grátis acima de (R$)" type="number" step="0.01" {...register('freeDeliveryAbove')} />
        <Input label="Raio máximo de entrega (km)" type="number" step="0.1" {...register('deliveryRadiusKm')} />
      </div>
      <SaveBar isSubmitting={isSubmitting} errorMessage={errors.root?.message} />
    </form>
  )
}

// ---------------------------------------------------------------------------
// Notificações
// ---------------------------------------------------------------------------

const notificationsSchema = z.object({
  whatsappEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
})

type NotificationsForm = z.infer<typeof notificationsSchema>

function NotificationsTab({ settings: _settings }: { settings: EstablishmentSettings }) {
  const queryClient = useQueryClient()
  const { data: channelSettings, isLoading } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: notificationSettingsService.get,
  })

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NotificationsForm>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      whatsappEnabled: false,
      emailEnabled: false,
      pushEnabled: false,
    },
  })

  useEffect(() => {
    if (channelSettings) {
      reset({
        whatsappEnabled: channelSettings.whatsappEnabled,
        emailEnabled: channelSettings.emailEnabled,
        pushEnabled: channelSettings.pushEnabled,
      })
    }
  }, [channelSettings, reset])

  const mutation = useMutation({
    mutationFn: (data: NotificationsForm) => notificationSettingsService.update(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-settings'] }),
  })

  const onSubmit = async (data: NotificationsForm) => {
    try {
      await mutation.mutateAsync(data)
    } catch (err) {
      setError('root', { message: err instanceof ApiError ? err.message : 'Erro ao salvar' })
    }
  }

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-[var(--radius-lg)] border border-border bg-surface p-5"
    >
      <div>
        <h3 className="mb-1 text-sm font-medium text-text">Canais de notificação</h3>
        <p className="mb-3 text-xs text-muted">
          Ative os canais desejados. Sem credenciais no servidor, o envio fica em modo desenvolvimento
          e não simula sucesso em produção.
        </p>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" {...register('whatsappEnabled')} className="rounded border-border" />
            WhatsApp
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" {...register('emailEnabled')} className="rounded border-border" />
            E-mail
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" {...register('pushEnabled')} className="rounded border-border" />
            Push
          </label>
        </div>
      </div>

      <SaveBar isSubmitting={isSubmitting} errorMessage={errors.root?.message} />
    </form>
  )
}

// ---------------------------------------------------------------------------
// Domínio / slug
// ---------------------------------------------------------------------------

function DomainTab({
  establishment,
  settings,
}: {
  establishment: Establishment
  settings: EstablishmentSettings
}) {
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{ slug: string; publicMenuSlug: string }>({
    defaultValues: { slug: establishment.slug, publicMenuSlug: settings.publicMenuSlug || '' },
  })

  const slug = watch('slug')
  const publicBase = (import.meta.env.VITE_PUBLIC_MENU_URL as string | undefined)?.replace(/\/$/, '') || ''
  const publicUrl = slug ? `${publicBase}/${slug}` : ''

  const mutation = useMutation({
    mutationFn: async (data: { slug: string; publicMenuSlug: string }) => {
      await establishmentService.update({ slug: data.slug } as Partial<Establishment>)
      return settingsService.updateSettings({ publicMenuSlug: data.publicMenuSlug })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['establishment'] })
      queryClient.invalidateQueries({ queryKey: ['establishment-settings'] })
    },
  })

  const onSubmit = async (data: { slug: string; publicMenuSlug: string }) => {
    try {
      await mutation.mutateAsync(data)
    } catch (err) {
      setError('root', { message: err instanceof ApiError ? err.message : 'Erro ao salvar' })
    }
  }

  const copyLink = async () => {
    if (!publicUrl) return
    await navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5"
    >
      <Input
        label="Slug do estabelecimento"
        hint="Usado na URL do seu cardápio público"
        error={errors.slug?.message}
        {...register('slug', { required: 'Slug obrigatório' })}
      />
      <Input label="Slug alternativo do cardápio" hint="Opcional" {...register('publicMenuSlug')} />

      <div className="rounded-[var(--radius-md)] border border-border bg-elevated p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
          Link do cardápio público
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 truncate rounded-[var(--radius-sm)] bg-bg px-3 py-2 text-sm text-text">
            {publicUrl || 'Defina um slug para gerar o link'}
          </code>
          <Button type="button" variant="outline" size="sm" onClick={copyLink} disabled={!publicUrl}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copiado' : 'Copiar'}
          </Button>
          <a
            href={publicUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border px-3 text-sm text-text hover:border-accent hover:text-accent',
              !publicUrl && 'pointer-events-none opacity-50',
            )}
          >
            <ExternalLink className="h-4 w-4" />
            Abrir
          </a>
        </div>
      </div>

      <SaveBar isSubmitting={isSubmitting} errorMessage={errors.root?.message} />
    </form>
  )
}

// ---------------------------------------------------------------------------
// Políticas
// ---------------------------------------------------------------------------

const policiesSchema = z.object({
  cancellationPolicy: z.string().optional(),
  deliveryPolicy: z.string().optional(),
  privacyPolicy: z.string().optional(),
  termsOfUse: z.string().optional(),
  extraInfo: z.string().optional(),
})

type PoliciesForm = z.infer<typeof policiesSchema>

function PoliciesTab({ settings }: { settings: EstablishmentSettings }) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PoliciesForm>({
    resolver: zodResolver(policiesSchema),
    defaultValues: {
      cancellationPolicy: settings.cancellationPolicy || '',
      deliveryPolicy: settings.deliveryPolicy || '',
      privacyPolicy: settings.privacyPolicy || '',
      termsOfUse: settings.termsOfUse || '',
      extraInfo: settings.extraInfo || '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: PoliciesForm) => settingsService.updateSettings(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['establishment-settings'] }),
  })

  const onSubmit = async (data: PoliciesForm) => {
    try {
      await mutation.mutateAsync(data)
    } catch (err) {
      setError('root', { message: err instanceof ApiError ? err.message : 'Erro ao salvar' })
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5"
    >
      <Textarea label="Política de cancelamento" {...register('cancellationPolicy')} />
      <Textarea label="Política de entrega" {...register('deliveryPolicy')} />
      <Textarea label="Política de privacidade" {...register('privacyPolicy')} />
      <Textarea label="Termos de uso" {...register('termsOfUse')} />
      <Textarea label="Informações adicionais" {...register('extraInfo')} />
      <SaveBar isSubmitting={isSubmitting} errorMessage={errors.root?.message} />
    </form>
  )
}
