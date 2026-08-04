export type OrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'COMPLETED'
  | 'CANCELLED'

export type OrderType = 'DELIVERY' | 'PICKUP' | 'DINE_IN'

export type PaymentMethod = 'CASH' | 'PIX' | 'CARD' | 'ONLINE'

export type SelectionType = 'SINGLE' | 'MULTIPLE'

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED'

export type ProductTag =
  | 'mais-pedido'
  | 'novo'
  | 'promocao'
  | 'destaque'
  | 'vegano'
  | 'apimentado'

export interface BusinessHours {
  dayOfWeek: number
  openTime: string | null
  closeTime: string | null
  breakStart?: string | null
  breakEnd?: string | null
  isClosed: boolean
}

export interface OpenStatus {
  isOpenNow: boolean
  reason: 'manual' | 'closed_day' | 'outside_hours' | 'open'
  todayHours: BusinessHours | null
  nextOpen: { dayOfWeek: number; openTime: string } | null
}

export interface StoreSettings {
  minOrderValue: number | null
  estimatedMinutes: number | null
  freeDeliveryAbove: number | null
  deliveryFeeType: string
  fixedDeliveryFee: number | null
  acceptDelivery: boolean
  acceptPickup: boolean
  acceptDineIn: boolean
  paymentMethods: PaymentMethod[]
  minOrderMessage?: string | null
  allowScheduledOrders?: boolean
  scheduleMinLeadMinutes?: number
  scheduleMaxDaysAhead?: number
  scheduleSlotMinutes?: number
  scheduleMaxPerSlot?: number | null
}

export interface Establishment {
  id: string
  name: string
  slug: string
  description: string | null
  phone: string | null
  whatsapp: string | null
  address: string | null
  logoUrl: string | null
  bannerUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
  isOpen: boolean
}

export interface ProductSummary {
  id: string
  categoryId: string
  name: string
  description: string | null
  price: number
  promoPrice: number | null
  imageUrl: string | null
  prepTimeMinutes: number | null
  isAvailable: boolean
  isFeatured: boolean
  sortOrder: number
  hasAdditionals: boolean
}

export interface Category {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  sortOrder: number
  products: ProductSummary[]
}

export interface DeliveryZone {
  id: string
  name: string
  fee: number
  estimatedMinutes: number | null
}

export interface MenuResponse {
  establishment: Establishment
  openStatus: OpenStatus
  settings: StoreSettings
  businessHours: BusinessHours[]
  deliveryZones: DeliveryZone[]
  categories: Category[]
  featuredProducts: ProductSummary[]
}

export interface Additional {
  id: string
  name: string
  price: number
  sortOrder: number
}

export interface AdditionalGroup {
  id: string
  name: string
  selectionType: SelectionType
  isRequired: boolean
  minQuantity: number
  maxQuantity: number
  sortOrder: number
  additionals: Additional[]
}

export interface ProductDetail extends ProductSummary {
  category: { id: string; name: string }
  images: { id: string; url: string; sortOrder: number }[]
  additionalGroups: AdditionalGroup[]
}

export interface CartAdditional {
  additionalId: string
  name: string
  price: number
  quantity: number
}

export interface CartItem {
  key: string
  productId: string
  name: string
  imageUrl: string | null
  unitPrice: number
  quantity: number
  notes?: string
  additionals: CartAdditional[]
}

export interface CreateOrderPayload {
  type: OrderType
  customer: { name: string; phone: string }
  address?: {
    street: string
    number?: string
    complement?: string
    neighborhood: string
    city: string
    state?: string
    zipCode?: string
    reference?: string
  }
  paymentMethod: PaymentMethod
  changeFor?: number
  notes?: string
  couponCode?: string
  scheduledFor?: string
  items: Array<{
    productId: string
    quantity: number
    notes?: string
    additionals: Array<{ additionalId: string; quantity?: number }>
  }>
}

export interface OrderResponse {
  id: string
  code: string
  status: OrderStatus
  type: OrderType
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  notes: string | null
  isScheduled?: boolean
  scheduledFor?: string | null
  createdAt: string
  customer?: { name: string; phone: string }
  payment?: { method: PaymentMethod; status: PaymentStatus | string; amount: number }
  items: Array<{
    id: string
    name: string
    quantity: number
    unitPrice: number
    total: number
    notes?: string | null
    imageUrl?: string | null
    product?: { id: string; name: string; imageUrl?: string | null }
    additionals?: Array<{ id: string; name: string; price: number }>
  }>
  address?: {
    street: string
    number?: string | null
    neighborhood: string
    city: string
  } | null
  statusHistory?: Array<{ status: OrderStatus; changedAt: string }>
  establishment?: {
    name: string
    whatsapp: string | null
    phone: string | null
    estimatedMinutes: number | null
  }
}

export interface PaymentIntent {
  id: string
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  provider: string | null
  externalId: string | null
  qrCodeBase64: string | null
  copyPaste: string | null
  checkoutUrl: string | null
  expiresAt: string | null
}

export interface PublicBanner {
  id: string
  title: string
  subtitle: string | null
  imageUrl: string
  buttonLabel: string | null
  linkUrl: string | null
  productId: string | null
  categoryId: string | null
  showDesktop: boolean
  showMobile: boolean
  sortOrder: number
}

export type PromotionType = 'PERCENTAGE' | 'FIXED' | 'BUY_X_GET_Y'

export interface PublicPromotion {
  id: string
  name: string
  description: string | null
  type: PromotionType
  value: number
  buyQuantity: number | null
  getQuantity: number | null
  imageUrl: string | null
  startsAt: string | null
  endsAt: string | null
  startTime: string | null
  endTime: string | null
  priority: number
  products: Array<{ id: string; name: string; imageUrl?: string | null }>
  categories: Array<{ id: string; name: string }>
}

export interface FavoriteItem {
  id: string
  productId: string
  createdAt: string
  product: {
    id: string
    name: string
    price: number
    promoPrice: number | null
    imageUrl: string | null
    isAvailable: boolean
    category: { id: string; name: string } | null
  }
}

export interface CustomerOrderHistoryItem {
  id: string
  code: string
  status: OrderStatus
  type: OrderType
  total: number
  isScheduled: boolean
  scheduledFor: string | null
  createdAt: string
  payment: { method: PaymentMethod; status: PaymentStatus; amount: number } | null
  items: Array<{
    productId: string | null
    name: string
    quantity: number
    unitPrice: number
    total: number
    imageUrl: string | null
    additionals: Array<{ name: string; price: number }>
  }>
}

export interface ReorderResult {
  orderId: string
  code: string
  available: Array<{
    productId: string
    name: string
    quantity: number
    currentPrice: number
    imageUrl: string | null
    additionals: Array<{ name: string; additionalId: string | null }>
  }>
  unavailable: Array<{ name: string; productId: string | null; reason: string }>
}
