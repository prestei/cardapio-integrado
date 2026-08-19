export type UserRole =
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'ATTENDANT'
  | 'KITCHEN'
  | 'DELIVERY'

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

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED'

export type DashboardPeriod = 'today' | '7d' | '30d' | 'custom'

export interface EstablishmentSummary {
  id: string
  name: string
  slug: string
  logoUrl?: string | null
  isOpen?: boolean
  plan?: string
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string | null
  avatarUrl?: string | null
  establishmentId: string
  establishment?: EstablishmentSummary
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
  establishmentName: string
}

export interface ForgotPasswordInput {
  email: string
}

export interface ResetPasswordInput {
  token: string
  password: string
}

export interface Customer {
  id: string
  name: string
  phone?: string | null
  email?: string | null
}

export interface Payment {
  id: string
  orderId: string
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  paidAt?: string | null
}

export interface OrderItemAdditional {
  id: string
  name: string
  price: number
}

export interface OrderItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  total: number
  notes?: string | null
  product?: { id: string; name: string; imageUrl?: string | null }
  additionals?: OrderItemAdditional[]
}

export interface Order {
  id: string
  code: string
  type: OrderType
  status: OrderStatus
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  notes?: string | null
  createdAt: string
  updatedAt?: string
  customer?: Customer | null
  payment?: Payment | null
  items?: OrderItem[]
}

export interface Category {
  id: string
  establishmentId: string
  name: string
  description?: string | null
  imageUrl?: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: { products: number }
}

export interface CreateCategoryInput {
  name: string
  description?: string
  imageUrl?: string
  sortOrder?: number
  isActive?: boolean
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>

export interface ProductImage {
  id: string
  url: string
  sortOrder: number
}

export interface Product {
  id: string
  establishmentId: string
  categoryId: string
  name: string
  description?: string | null
  price: number
  promoPrice?: number | null
  imageUrl?: string | null
  internalCode?: string | null
  prepTimeMinutes?: number | null
  stock?: number | null
  isAvailable: boolean
  isFeatured: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  category?: { id: string; name: string }
  images?: ProductImage[]
}

export interface CreateProductInput {
  categoryId: string
  name: string
  description?: string
  price: number
  promoPrice?: number | null
  imageUrl?: string
  internalCode?: string
  prepTimeMinutes?: number | null
  stock?: number | null
  isAvailable?: boolean
  isFeatured?: boolean
  sortOrder?: number
}

export type UpdateProductInput = Partial<CreateProductInput>

export interface UpdateProductPriceInput {
  price: number
  promoPrice?: number | null
}

export interface Establishment {
  id: string
  name: string
  displayName?: string | null
  slug: string
  description?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  cnpj?: string | null
  logoUrl?: string | null
  bannerUrl?: string | null
  primaryColor: string
  secondaryColor: string
  accentColor?: string
  plan: string
  isOpen: boolean
  closedReason?: string | null
  createdAt: string
  updatedAt: string
}

export interface DashboardMetrics {
  period: DashboardPeriod
  from: string
  to: string
  revenue: number
  orders: number
  avgTicket: number
  inProgress: number
  newCustomers: number
  comparison: {
    revenue: number | null
    orders: number | null
    avgTicket: number | null
  }
  topProducts: Array<{
    productId: string | null
    name: string
    quantity: number
    revenue: number
  }>
  salesByDay: Array<{ date: string; revenue: number; orders: number }>
  ordersByHour: Array<{ hour: number; orders: number }>
  weeklyRevenue: Array<{ week: number; revenue: number; orders: number }>
  paymentMethods: Array<{
    method: PaymentMethod
    amount: number
    count: number
  }>
  recentOrders: Order[]
}

export interface OrderFilters {
  status?: OrderStatus
  type?: OrderType
  search?: string
  from?: string
  to?: string
}

export interface ApiErrorResponse {
  error: string
}

// ---------------------------------------------------------------------------
// Additionals (grupos de adicionais)
// ---------------------------------------------------------------------------

export type SelectionType = 'SINGLE' | 'MULTIPLE'

export interface Additional {
  id: string
  additionalGroupId: string
  name: string
  description?: string | null
  price: number
  imageUrl?: string | null
  isAvailable: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface AdditionalGroup {
  id: string
  establishmentId: string
  name: string
  description?: string | null
  selectionType: SelectionType
  isRequired: boolean
  minQuantity: number
  maxQuantity: number
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  additionals?: Additional[]
  products?: Array<{ id: string; name: string }>
  _count?: { additionals: number; products: number }
}

export interface CreateAdditionalGroupInput {
  name: string
  description?: string
  selectionType: SelectionType
  isRequired?: boolean
  minQuantity?: number
  maxQuantity?: number
  sortOrder?: number
  isActive?: boolean
}

export type UpdateAdditionalGroupInput = Partial<CreateAdditionalGroupInput>

export interface CreateAdditionalInput {
  name: string
  description?: string
  price: number
  imageUrl?: string
  isAvailable?: boolean
  sortOrder?: number
}

export type UpdateAdditionalInput = Partial<CreateAdditionalInput>

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

export type CouponType = 'PERCENTAGE' | 'FIXED' | 'FREE_DELIVERY'

export interface Coupon {
  id: string
  establishmentId: string
  code: string
  description?: string | null
  type: CouponType
  value: number
  minOrderValue?: number | null
  startsAt?: string | null
  endsAt?: string | null
  usageLimit?: number | null
  perCustomerLimit?: number | null
  usageCount: number
  isActive: boolean
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCouponInput {
  code: string
  description?: string
  type: CouponType
  value: number
  minOrderValue?: number | null
  startsAt?: string | null
  endsAt?: string | null
  usageLimit?: number | null
  perCustomerLimit?: number | null
  isActive?: boolean
}

export type UpdateCouponInput = Partial<CreateCouponInput> & { isArchived?: boolean }

// ---------------------------------------------------------------------------
// Delivery zones & operations
// ---------------------------------------------------------------------------

export type DeliveryZoneType = 'NEIGHBORHOOD' | 'REGION' | 'ZIP' | 'RADIUS'

export interface DeliveryZone {
  id: string
  establishmentId: string
  name: string
  zoneType: DeliveryZoneType
  fee: number
  minOrderValue?: number | null
  estimatedMinutes?: number | null
  zipPrefix?: string | null
  radiusKm?: number | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateDeliveryZoneInput {
  name: string
  zoneType: DeliveryZoneType
  fee: number
  minOrderValue?: number | null
  estimatedMinutes?: number | null
  zipPrefix?: string
  radiusKm?: number | null
  sortOrder?: number
  isActive?: boolean
}

export type UpdateDeliveryZoneInput = Partial<CreateDeliveryZoneInput>

export interface DeliveryOrder extends Order {
  assignedDeliveryUserId?: string | null
  assignedDelivery?: { id: string; name: string } | null
  deliveryLeftAt?: string | null
  deliveryCompletedAt?: string | null
  address?: Address | null
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export interface Address {
  id: string
  customerId: string
  label?: string | null
  street: string
  number?: string | null
  complement?: string | null
  neighborhood: string
  city: string
  state?: string | null
  zipCode?: string | null
  isDefault: boolean
}

export interface CustomerDetail {
  id: string
  establishmentId: string
  name: string
  phone: string
  email?: string | null
  notes?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  addresses?: Address[]
  orders?: Order[]
  stats?: {
    totalOrders: number
    totalSpent: number
    avgTicket: number
    lastOrderAt: string | null
  }
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: PaginationMeta
}

export type CustomerListItem = Pick<
  CustomerDetail,
  'id' | 'establishmentId' | 'name' | 'phone' | 'email' | 'isActive' | 'createdAt'
> & {
  _count?: { orders: number; addresses?: number }
  stats?: {
    totalOrders: number
    totalSpent: number
    lastOrderAt: string | null
  }
}

export interface UpdateCustomerInput {
  name?: string
  phone?: string
  email?: string
  notes?: string
  isActive?: boolean
}

// ---------------------------------------------------------------------------
// Team / employees
// ---------------------------------------------------------------------------

export interface Employee {
  id: string
  establishmentId: string
  name: string
  email: string
  role: UserRole
  phone?: string | null
  avatarUrl?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateEmployeeInput {
  name: string
  email: string
  password: string
  role: UserRole
  phone?: string
  isActive?: boolean
}

export type UpdateEmployeeInput = Partial<Omit<CreateEmployeeInput, 'password'>> & {
  password?: string
}

// ---------------------------------------------------------------------------
// Establishment settings & hours
// ---------------------------------------------------------------------------

export interface BusinessHours {
  id?: string
  dayOfWeek: number
  openTime?: string | null
  closeTime?: string | null
  breakStart?: string | null
  breakEnd?: string | null
  isClosed: boolean
  sortOrder?: number
}

export type MenuSectionCopy = {
  kicker: string
  title: string
  description: string
}

export type MenuSectionsConfig = {
  favorites: MenuSectionCopy
  menu: MenuSectionCopy
  promotions: MenuSectionCopy
  nav: {
    loja: string
    favoritos: string
    cardapio: string
    promocoes: string
  }
}

export interface EstablishmentSettings {
  id?: string
  deliveryFeeType: 'FIXED' | 'ZONE'
  fixedDeliveryFee?: number | null
  minOrderValue?: number | null
  minOrderDelivery?: number | null
  minOrderMessage?: string | null
  freeDeliveryAbove?: number | null
  deliveryRadiusKm?: number | null
  estimatedMinutes?: number | null
  acceptCash: boolean
  acceptPix: boolean
  acceptCard: boolean
  acceptOnline: boolean
  acceptDelivery: boolean
  acceptPickup: boolean
  acceptDineIn: boolean
  allowScheduledOrders: boolean
  scheduleMinLeadMinutes: number
  scheduleSlotIntervalMinutes?: number | null
  scheduleMaxOrdersPerSlot?: number | null
  scheduleMaxDaysAhead?: number | null
  publicMenuSlug?: string | null
  themeMode: 'dark' | 'light'
  menuSectionsJson?: MenuSectionsConfig | null
  cancellationPolicy?: string | null
  deliveryPolicy?: string | null
  privacyPolicy?: string | null
  termsOfUse?: string | null
  extraInfo?: string | null
  notifyNewOrderSound?: boolean
  notifyNewOrderEmail?: boolean
  notifyNewOrderWhatsapp?: boolean
  notifyLowStock?: boolean
  notifyDailySummary?: boolean
}

export type UpdateEstablishmentSettingsInput = Partial<EstablishmentSettings>

// ---------------------------------------------------------------------------
// QR Codes
// ---------------------------------------------------------------------------

export type QrCodeKind = 'MENU' | 'TABLE' | 'COUNTER' | 'SHOWCASE' | 'SOCIAL'

export interface QrCodeEntry {
  id: string
  establishmentId: string
  name: string
  kind: QrCodeKind
  targetPath: string
  tableLabel?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateQrCodeInput {
  name: string
  kind: QrCodeKind
  targetPath?: string
  tableLabel?: string
  isActive?: boolean
}

export type UpdateQrCodeInput = Partial<CreateQrCodeInput>

// ---------------------------------------------------------------------------
// Marketing: Promotions, Banners & Campaigns
// ---------------------------------------------------------------------------

export type PromotionType =
  | 'PERCENTAGE'
  | 'FIXED'
  | 'PROMO_PRICE'
  | 'BUY_X_GET_Y'
  | 'COMBO'
  | 'FREE_DELIVERY'
  | 'CATEGORY'
  | 'PRODUCT'

export type PromotionStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'ARCHIVED'

export interface Promotion {
  id: string
  establishmentId: string
  name: string
  description?: string | null
  type: PromotionType
  value: number
  buyQuantity?: number | null
  getQuantity?: number | null
  imageUrl?: string | null
  startsAt?: string | null
  endsAt?: string | null
  startTime?: string | null
  endTime?: string | null
  usageLimit?: number | null
  usageCount?: number
  priority?: number
  sortOrder?: number
  status: PromotionStatus
  isActive: boolean
  products?: Array<{ productId: string; product?: { id: string; name: string } }>
  categories?: Array<{ categoryId: string; category?: { id: string; name: string } }>
  createdAt: string
  updatedAt: string
}

export interface CreatePromotionInput {
  name: string
  description?: string
  type: PromotionType
  value?: number
  buyQuantity?: number | null
  getQuantity?: number | null
  imageUrl?: string
  productIds?: string[]
  categoryIds?: string[]
  startsAt?: string | null
  endsAt?: string | null
  startTime?: string | null
  endTime?: string | null
  usageLimit?: number | null
  priority?: number
  sortOrder?: number
  status?: PromotionStatus
  isActive?: boolean
}

export type UpdatePromotionInput = Partial<CreatePromotionInput>

export interface Banner {
  id: string
  establishmentId: string
  title: string
  subtitle?: string | null
  imageUrl: string
  buttonLabel?: string | null
  linkUrl?: string | null
  productId?: string | null
  categoryId?: string | null
  sortOrder: number
  startsAt?: string | null
  endsAt?: string | null
  showDesktop: boolean
  showMobile: boolean
  isActive: boolean
  views?: number
  clicks?: number
  createdAt: string
  updatedAt: string
}

export interface CreateBannerInput {
  title: string
  subtitle?: string
  imageUrl: string
  buttonLabel?: string
  linkUrl?: string
  productId?: string | null
  categoryId?: string | null
  sortOrder?: number
  startsAt?: string | null
  endsAt?: string | null
  showDesktop?: boolean
  showMobile?: boolean
  isActive?: boolean
}

export type UpdateBannerInput = Partial<CreateBannerInput>

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED'

export interface Campaign {
  id: string
  establishmentId: string
  name: string
  objective?: string | null
  startsAt?: string | null
  endsAt?: string | null
  segment?: string | null
  status: CampaignStatus | string
  views?: number
  clicks?: number
  ordersCount?: number
  revenue?: number
  isActive: boolean
  banners?: Array<{ bannerId: string; banner?: Banner }>
  promotions?: Array<{ promotionId: string; promotion?: Promotion }>
  createdAt: string
  updatedAt: string
}

export interface CreateCampaignInput {
  name: string
  objective?: string
  startsAt?: string | null
  endsAt?: string | null
  segment?: string
  status?: CampaignStatus
  isActive?: boolean
  bannerIds?: string[]
  promotionIds?: string[]
}

export type UpdateCampaignInput = Partial<CreateCampaignInput>

// ---------------------------------------------------------------------------
// Cash register (Caixa)
// ---------------------------------------------------------------------------

export type CashMovementType =
  | 'SALE'
  | 'INCOME'
  | 'OUTCOME'
  | 'BLEED'
  | 'ADJUSTMENT'
  | 'REFUND'

export type CashRegisterStatus = 'OPEN' | 'CLOSED'

export interface CashMovement {
  id: string
  cashRegisterId: string
  type: CashMovementType
  amount: number
  reason?: string | null
  orderId?: string | null
  createdAt: string
  user?: { id: string; name: string }
}

export interface CashRegister {
  id: string
  establishmentId: string
  status: CashRegisterStatus
  openedAt: string
  closedAt?: string | null
  openingAmount: number
  closingAmount?: number | null
  expectedAmount?: number | null
  difference?: number | null
  openingNote?: string | null
  closingNote?: string | null
  openedBy?: { id: string; name: string }
  closedBy?: { id: string; name: string } | null
  movements?: CashMovement[]
}

export interface OpenCashInput {
  openingAmount: number
  note?: string
}

export interface CloseCashInput {
  closingAmount: number
  note?: string
}

export interface CreateCashMovementInput {
  type: CashMovementType
  amount: number
  reason?: string
  orderId?: string
}

// ---------------------------------------------------------------------------
// KDS (Cozinha)
// ---------------------------------------------------------------------------

export type KdsOrder = Order

// ---------------------------------------------------------------------------
// Dashboard alerts
// ---------------------------------------------------------------------------

export type DashboardAlertSeverity = 'info' | 'warning' | 'critical'

export interface DashboardAlert {
  id: string
  severity: DashboardAlertSeverity
  title: string
  message: string
  createdAt: string
  link?: string | null
}

// ---------------------------------------------------------------------------
// Reports (extended, optional endpoints)
// ---------------------------------------------------------------------------

export interface ReportsSalesData {
  salesByDay: Array<{ date: string; revenue: number; orders: number }>
  salesByType: Array<{ type: OrderType; revenue: number; orders: number }>
  comparison: { revenue: number | null; orders: number | null }
}

export interface ReportsProductsData {
  topProducts: Array<{ productId: string | null; name: string; quantity: number; revenue: number }>
  topCategories: Array<{ categoryId: string | null; name: string; quantity: number; revenue: number }>
}

export interface ReportsCustomersData {
  newCustomers: number
  returningCustomers: number
  topCustomers: Array<{ customerId: string; name: string; orders: number; totalSpent: number }>
}

export interface ReportsPaymentsData {
  paymentMethods: Array<{ method: PaymentMethod; amount: number; count: number }>
}

export interface ReportsOperationsData {
  avgPrepTimeMinutes: number | null
  avgDeliveryTimeMinutes: number | null
  cancellationRate: number | null
  ordersByHour: Array<{ hour: number; orders: number }>
}
