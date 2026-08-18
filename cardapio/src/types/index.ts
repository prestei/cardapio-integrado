export interface StoreImage {
  id: string
  url: string
  alt: string
  label: string
}

export interface Store {
  id: string
  name: string
  slug: string
  tagline: string
  description: string
  phone: string
  whatsapp: string
  address: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontDisplay?: string
  fontBody?: string
  isOpen: boolean
  images: StoreImage[]
}

export interface Addon {
  id: string
  name: string
  price: number
  isAvailable: boolean
}

export interface AddonGroup {
  id: string
  name: string
  min: number
  max: number
  required: boolean
  addons: Addon[]
}

export interface Product {
  id: string
  categoryId: string
  name: string
  description: string
  price: number
  promoPrice: number | null
  imageUrl: string
  prepTimeMinutes?: number | null
  isAvailable: boolean
  isFeatured: boolean
  hasAdditionals: boolean
  tags?: string[]
  addonGroups?: AddonGroup[]
}

export interface Category {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  sortOrder: number
  products: Product[]
}

export interface Promotion {
  id: string
  title: string
  subtitle: string
  description: string
  imageUrl: string
  originalPrice: number
  promoPrice: number
  discountPercent: number
  validUntil: string
  productIds: string[]
  ctaLabel: string
}

export interface CartAddon {
  id: string
  name: string
  price: number
  quantity: number
}

export interface CartItem {
  key: string
  productId: string
  name: string
  imageUrl: string
  unitPrice: number
  quantity: number
  notes?: string
  addons: CartAddon[]
}

export interface MenuSectionCopy {
  kicker: string
  title: string
  description: string
}

export interface MenuSections {
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

export interface MenuData {
  store: Store
  categories: Category[]
  featuredProducts: Product[]
  promotions: Promotion[]
  sections: MenuSections
}

export type SectionId = 'loja' | 'favoritos' | 'cardapio' | 'promocoes'
