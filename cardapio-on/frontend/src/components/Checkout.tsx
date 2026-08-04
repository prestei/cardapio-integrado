import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCart, getCartItemTotal } from '@/hooks/useCart'
import { useStore } from '@/contexts/StoreContext'
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppOrderUrl,
  calculateDelivery,
  createOrder,
  validateCoupon,
} from '@/services/orders'
import { formatCurrency } from '@/utils/currency'
import { formatPhoneInput, onlyDigits } from '@/utils/formatters'
import { isValidName, isValidPhone } from '@/utils/validators'
import { combineDateTimeToIso, getAvailableSlots, maxScheduleDateKey, todayDateKey } from '@/utils/schedule'
import type { OrderType, PaymentMethod } from '@/types'
import { ApiError } from '@/services/api'
import { AddressAutocomplete } from '@/components/AddressAutocomplete'

export function CheckoutForm() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const { menu } = useStore()
  const { items, subtotal, clearCart } = useCart()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [type, setType] = useState<OrderType>('DELIVERY')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState(
    menu?.deliveryZones[0]?.name ?? '',
  )
  const [city, setCity] = useState('São Paulo')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    menu?.settings.paymentMethods[0] ?? 'PIX',
  )
  const [changeFor, setChangeFor] = useState('')
  const [notes, setNotes] = useState('')
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [couponInput, setCouponInput] = useState('')
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [discount, setDiscount] = useState(0)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponMessage, setCouponMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  const allowScheduledOrders = menu?.settings.allowScheduledOrders ?? false
  const scheduleMinLeadMinutes = menu?.settings.scheduleMinLeadMinutes ?? 60
  const scheduleMaxDaysAhead = menu?.settings.scheduleMaxDaysAhead ?? 7
  const scheduleSlotMinutes = menu?.settings.scheduleSlotMinutes ?? 30

  const minScheduleDate = todayDateKey()
  const maxScheduleDate = maxScheduleDateKey(scheduleMaxDaysAhead)

  const availableSlots = useMemo(
    () =>
      isScheduled && scheduledDate
        ? getAvailableSlots(
            menu?.businessHours ?? [],
            scheduledDate,
            scheduleSlotMinutes,
            scheduleMinLeadMinutes,
          )
        : [],
    [isScheduled, scheduledDate, menu?.businessHours, scheduleSlotMinutes, scheduleMinLeadMinutes],
  )

  useEffect(() => {
    if (scheduledTime && !availableSlots.includes(scheduledTime)) {
      setScheduledTime('')
    }
  }, [availableSlots, scheduledTime])

  const paymentOptions = menu?.settings.paymentMethods ?? ['PIX', 'CASH', 'CARD']

  const availableTypes = useMemo(() => {
    const list: Array<[OrderType, string]> = []
    if (menu?.settings.acceptDelivery !== false) list.push(['DELIVERY', 'Entrega'])
    if (menu?.settings.acceptPickup !== false) list.push(['PICKUP', 'Retirada'])
    if (menu?.settings.acceptDineIn !== false) list.push(['DINE_IN', 'No local'])
    return list
  }, [menu])

  useEffect(() => {
    if (availableTypes.length && !availableTypes.some(([t]) => t === type)) {
      setType(availableTypes[0]![0])
    }
  }, [availableTypes, type])

  const refreshDelivery = useCallback(
    async (bairro: string, orderType: OrderType = type) => {
      if (!slug || !bairro || orderType !== 'DELIVERY') {
        setDeliveryFee(0)
        return
      }
      try {
        const result = await calculateDelivery(slug, bairro, subtotal)
        setDeliveryFee(result.fee ?? 0)
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message)
          setDeliveryFee(0)
          return
        }
        const zone = menu?.deliveryZones.find(
          (z) => z.name.toLowerCase() === bairro.toLowerCase(),
        )
        setDeliveryFee(zone?.fee ?? menu?.settings.fixedDeliveryFee ?? 0)
      }
    },
    [slug, subtotal, type, menu],
  )

  useEffect(() => {
    if (type === 'DELIVERY' && neighborhood) {
      void refreshDelivery(neighborhood, type)
    } else {
      setDeliveryFee(0)
    }
  }, [type, neighborhood, refreshDelivery])

  const total = useMemo(
    () => Math.max(0, subtotal + (type === 'DELIVERY' ? deliveryFee : 0) - discount),
    [subtotal, deliveryFee, discount, type],
  )

  const applyCoupon = async () => {
    if (!slug || !couponInput.trim()) return
    setCouponLoading(true)
    setCouponMessage(null)
    try {
      const result = await validateCoupon(slug, couponInput.trim(), subtotal)
      setCouponCode(result.code)
      setDiscount(result.discount)
      setCouponMessage(`Cupom ${result.code} aplicado`)
    } catch (err) {
      setCouponCode(null)
      setDiscount(0)
      setCouponMessage(err instanceof ApiError ? err.message : 'Cupom inválido.')
    } finally {
      setCouponLoading(false)
    }
  }

  const clearCoupon = () => {
    setCouponCode(null)
    setCouponInput('')
    setDiscount(0)
    setCouponMessage(null)
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isValidName(name)) {
      setError('Informe seu nome.')
      return
    }
    if (!isValidPhone(phone)) {
      setError('Informe um telefone válido.')
      return
    }
    if (items.length === 0) {
      setError('Seu carrinho está vazio.')
      return
    }
    if (type === 'DELIVERY' && (!street.trim() || !neighborhood.trim())) {
      setError('Preencha o endereço completo para entrega.')
      return
    }

    const minOrder = menu?.settings.minOrderValue ?? 0
    if (minOrder > 0 && subtotal < minOrder) {
      setError(
        menu?.settings.minOrderMessage?.trim() ||
          `Pedido mínimo: ${formatCurrency(minOrder)}`,
      )
      return
    }

    let scheduledFor: string | undefined
    if (isScheduled) {
      if (!scheduledDate || !scheduledTime) {
        setError('Escolha a data e o horário para o agendamento.')
        return
      }
      const iso = combineDateTimeToIso(scheduledDate, scheduledTime)
      if (!iso) {
        setError('Data ou horário de agendamento inválidos.')
        return
      }
      scheduledFor = iso
    } else if (!menu?.openStatus.isOpenNow) {
      setError('Estamos fechados no momento. Não é possível finalizar o pedido.')
      return
    }

    setSubmitting(true)
    try {
      if (type === 'DELIVERY') await refreshDelivery(neighborhood)

      const order = await createOrder(slug, {
        type,
        scheduledFor,
        customer: { name: name.trim(), phone: onlyDigits(phone) },
        address:
          type === 'DELIVERY'
            ? {
                street: street.trim(),
                number: number.trim() || undefined,
                complement: complement.trim() || undefined,
                neighborhood: neighborhood.trim(),
                city: city.trim() || 'São Paulo',
              }
            : undefined,
        paymentMethod,
        changeFor:
          paymentMethod === 'CASH' && changeFor
            ? Number(changeFor.replace(',', '.'))
            : undefined,
        notes: notes.trim() || undefined,
        couponCode: couponCode ?? undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes,
          additionals: item.additionals.map((a) => ({
            additionalId: a.additionalId,
            quantity: a.quantity,
          })),
        })),
      })

      const message = buildWhatsAppOrderMessage({
        code: order.code,
        storeName: menu?.establishment.name ?? 'Estabelecimento',
        customerName: name.trim(),
        type,
        paymentMethod,
        items,
        subtotal,
        deliveryFee: type === 'DELIVERY' ? deliveryFee : 0,
        discount: order.discount ?? discount,
        total: order.total,
        address:
          type === 'DELIVERY'
            ? {
                street: street.trim(),
                number: number.trim() || undefined,
                complement: complement.trim() || undefined,
                neighborhood: neighborhood.trim(),
                city: city.trim() || 'São Paulo',
              }
            : undefined,
        notes: notes.trim() || undefined,
        changeFor:
          paymentMethod === 'CASH' && changeFor
            ? Number(changeFor.replace(',', '.'))
            : undefined,
      })

      clearCart()

      const wa = buildWhatsAppOrderUrl(menu?.establishment.whatsapp, message)

      navigate(`/${slug}/pedido/${order.code}`, {
        state: { whatsappUrl: wa, justCreated: true },
      })

      if (wa) {
        window.open(wa, '_blank', 'noopener,noreferrer')
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Não foi possível confirmar o pedido.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-line bg-surface px-4 py-8 text-center">
        <p className="text-sm text-muted">Seu carrinho está vazio.</p>
        <button
          type="button"
          onClick={() => navigate(`/${slug}/cardapio`)}
          className="mt-4 text-sm font-semibold text-ink underline-offset-2 hover:underline"
        >
          Voltar ao cardápio
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">
            Seus dados
          </h2>
          <label className="block">
            <span className="mb-1.5 block text-sm text-ink-soft">Nome</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 w-full rounded-[var(--radius-md)] border border-line px-3 text-sm outline-none focus:border-ink/30"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-ink-soft">Telefone</span>
            <input
              required
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
              className="h-11 w-full rounded-[var(--radius-md)] border border-line px-3 text-sm outline-none focus:border-ink/30"
            />
          </label>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">
            Tipo do pedido
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {availableTypes.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setType(value)
                  if (value !== 'DELIVERY') setDeliveryFee(0)
                  else void refreshDelivery(neighborhood)
                }}
                className={`h-11 rounded-[var(--radius-md)] border text-sm font-medium transition ${
                  type === value
                    ? 'btn-primary border-transparent'
                    : 'border-line bg-surface text-ink hover:bg-surface-2'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {allowScheduledOrders ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">
              Quando você quer receber?
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsScheduled(false)}
                className={`h-11 rounded-[var(--radius-md)] border text-sm font-medium transition ${
                  !isScheduled
                    ? 'btn-primary border-transparent'
                    : 'border-line bg-surface text-ink hover:bg-surface-2'
                }`}
              >
                Agora
              </button>
              <button
                type="button"
                onClick={() => setIsScheduled(true)}
                className={`h-11 rounded-[var(--radius-md)] border text-sm font-medium transition ${
                  isScheduled
                    ? 'btn-primary border-transparent'
                    : 'border-line bg-surface text-ink hover:bg-surface-2'
                }`}
              >
                Agendar
              </button>
            </div>
            {isScheduled ? (
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-sm text-ink-soft">Data</span>
                  <input
                    required
                    type="date"
                    value={scheduledDate}
                    min={minScheduleDate}
                    max={maxScheduleDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="h-11 w-full rounded-[var(--radius-md)] border border-line bg-canvas px-3 text-sm outline-none focus:border-ink/30"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-ink-soft">Horário</span>
                  <select
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    disabled={!scheduledDate}
                    className="h-11 w-full rounded-[var(--radius-md)] border border-line bg-canvas px-3 text-sm outline-none focus:border-ink/30 disabled:opacity-60"
                  >
                    <option value="">Selecione</option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </label>
                {scheduledDate && availableSlots.length === 0 ? (
                  <p className="col-span-2 text-sm text-muted">
                    Não há horários disponíveis para esta data. Tente outro dia.
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        {type === 'DELIVERY' ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">
              Endereço
            </h2>
            <AddressAutocomplete
              slug={slug}
              value={street}
              onChange={setStreet}
              onSelect={(suggestion) => {
                const parts = suggestion.description.split(',').map((p) => p.trim())
                if (parts[0]) setStreet(parts[0])
                if (parts[1] && !neighborhood) setNeighborhood(parts[1])
                if (parts[2]) setCity(parts[2].replace(/\s*-\s*[A-Z]{2}$/, '').trim() || city)
              }}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm text-ink-soft">Número</span>
                <input
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="h-11 w-full rounded-[var(--radius-md)] border border-line px-3 text-sm outline-none focus:border-ink/30"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm text-ink-soft">Complemento</span>
                <input
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  className="h-11 w-full rounded-[var(--radius-md)] border border-line px-3 text-sm outline-none focus:border-ink/30"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm text-ink-soft">Bairro</span>
              {menu?.deliveryZones.length ? (
                <select
                  value={neighborhood}
                  onChange={(e) => {
                    setNeighborhood(e.target.value)
                    void refreshDelivery(e.target.value)
                  }}
                  className="h-11 w-full rounded-[var(--radius-md)] border border-line bg-canvas px-3 text-sm outline-none focus:border-ink/30"
                >
                  {menu.deliveryZones.map((zone) => (
                    <option key={zone.id} value={zone.name}>
                      {zone.name} · {formatCurrency(zone.fee)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  required
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  onBlur={() => void refreshDelivery(neighborhood)}
                  className="h-11 w-full rounded-[var(--radius-md)] border border-line px-3 text-sm outline-none focus:border-ink/30"
                />
              )}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm text-ink-soft">Cidade</span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-11 w-full rounded-[var(--radius-md)] border border-line px-3 text-sm outline-none focus:border-ink/30"
              />
            </label>
          </section>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">
            Cupom
          </h2>
          <div className="flex gap-2">
            <input
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="Código do cupom"
              disabled={Boolean(couponCode)}
              className="h-11 min-w-0 flex-1 rounded-[var(--radius-md)] border border-line px-3 text-sm outline-none focus:border-ink/30 disabled:opacity-60"
            />
            {couponCode ? (
              <button
                type="button"
                onClick={clearCoupon}
                className="h-11 rounded-[var(--radius-md)] border border-line px-4 text-sm font-medium"
              >
                Remover
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void applyCoupon()}
                disabled={couponLoading || !couponInput.trim()}
                className="btn-primary h-11 rounded-[var(--radius-md)] px-4 text-sm font-semibold disabled:opacity-60"
              >
                {couponLoading ? '…' : 'Aplicar'}
              </button>
            )}
          </div>
          {couponMessage ? (
            <p className={`text-sm ${couponCode ? 'text-ink' : 'text-danger'}`}>
              {couponMessage}
            </p>
          ) : null}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">
            Pagamento
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {paymentOptions.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`h-11 rounded-[var(--radius-md)] border text-sm font-medium ${
                  paymentMethod === method
                    ? 'btn-primary border-transparent'
                    : 'border-line bg-surface text-ink'
                }`}
              >
                {method === 'PIX'
                  ? 'Pix'
                  : method === 'CASH'
                    ? 'Dinheiro'
                    : method === 'CARD'
                      ? 'Cartão'
                      : 'Online'}
              </button>
            ))}
          </div>
          {paymentMethod === 'CASH' ? (
            <label className="block">
              <span className="mb-1.5 block text-sm text-ink-soft">Troco para</span>
              <input
                inputMode="decimal"
                value={changeFor}
                onChange={(e) => setChangeFor(e.target.value)}
                placeholder="Ex.: 50"
                className="h-11 w-full rounded-[var(--radius-md)] border border-line px-3 text-sm outline-none focus:border-ink/30"
              />
            </label>
          ) : null}
          <label className="block">
            <span className="mb-1.5 block text-sm text-ink-soft">Observações</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-[var(--radius-md)] border border-line px-3 py-2.5 text-sm outline-none focus:border-ink/30"
            />
          </label>
        </section>
      </div>

      <aside className="h-fit rounded-[var(--radius-lg)] border border-line bg-surface p-4 sm:p-5">
        <h2 className="text-base font-semibold text-ink">Resumo</h2>
        <ul className="mt-4 space-y-3 border-b border-line pb-4">
          {items.map((item) => (
            <li key={item.key} className="flex justify-between gap-3 text-sm">
              <div>
                <p className="font-medium text-ink">
                  {item.quantity}x {item.name}
                </p>
                {item.additionals.length > 0 ? (
                  <p className="text-xs text-muted">
                    {item.additionals.map((a) => a.name).join(', ')}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 font-medium">
                {formatCurrency(getCartItemTotal(item))}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{formatCurrency(subtotal)}</dd>
          </div>
          {type === 'DELIVERY' ? (
            <div className="flex justify-between">
              <dt className="text-muted">Taxa de entrega</dt>
              <dd>{formatCurrency(deliveryFee)}</dd>
            </div>
          ) : null}
          {discount > 0 ? (
            <div className="flex justify-between">
              <dt className="text-muted">Desconto</dt>
              <dd>-{formatCurrency(discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-line pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatCurrency(total)}</dd>
          </div>
        </dl>

        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting || (!isScheduled && !menu?.openStatus.isOpenNow)}
          className="btn-primary mt-5 flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] text-sm font-semibold transition disabled:opacity-60"
        >
          {submitting
            ? 'Confirmando…'
            : !isScheduled && !menu?.openStatus.isOpenNow
              ? 'Loja fechada'
              : isScheduled
                ? 'Agendar Pedido'
                : 'Confirmar Pedido'}
        </button>
      </aside>
    </form>
  )
}
