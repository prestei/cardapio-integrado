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
  slug: string
  description?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  address?: string | null
  logoUrl?: string | null
  bannerUrl?: string | null
  primaryColor: string
  secondaryColor: string
  plan: string
  isOpen: boolean
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
