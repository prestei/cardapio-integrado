import type {
  AddonGroup,
  Category,
  MenuData,
  Product,
  Promotion,
  Store,
  StoreImage,
} from '@/types'
import { mockMenu } from '@/data/mock'

/** API public menu payload (cardapio-adm) */
export interface ApiMenuResponse {
  establishment: {
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
  openStatus?: { isOpenNow: boolean }
  categories: Array<{
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    sortOrder: number
    products: ApiProductSummary[]
  }>
  featuredProducts: ApiProductSummary[]
}

export interface ApiProductSummary {
  id: string
  categoryId: string
  name: string
  description: string | null
  price: number
  promoPrice: number | null
  imageUrl: string | null
  prepTimeMinutes?: number | null
  isAvailable: boolean
  isFeatured: boolean
  sortOrder?: number
  hasAdditionals: boolean
}

export interface ApiProductDetail extends ApiProductSummary {
  images?: Array<{ id: string; url: string; sortOrder: number }>
  additionalGroups?: ApiAddonGroup[]
}

export interface ApiAddonGroup {
  id: string
  name: string
  selectionType: string
  isRequired: boolean
  minQuantity: number
  maxQuantity: number
  sortOrder: number
  additionals: Array<{
    id: string
    name: string
    price: number
    sortOrder: number
    isAvailable?: boolean
  }>
}

const FALLBACK_FOOD: Record<string, string[]> = {
  hamb: [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=80&auto=format',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&q=80&auto=format',
    'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=1200&q=80&auto=format',
  ],
  beb: [
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200&q=80&auto=format',
    'https://images.unsplash.com/photo-1536935338788-846bb8044359?w=1200&q=80&auto=format',
  ],
  sobr: [
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1200&q=80&auto=format',
    'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=1200&q=80&auto=format',
  ],
  porc: [
    'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=1200&q=80&auto=format',
    'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=1200&q=80&auto=format',
  ],
  default: [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80&auto=format',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80&auto=format',
  ],
}

function hashIndex(seed: string, len: number): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return Math.abs(h) % len
}

function pickFallback(name: string, categoryName?: string): string {
  const key = `${categoryName ?? ''} ${name}`.toLowerCase()
  let bucket = FALLBACK_FOOD.default!
  if (/hamb|burger|smash|cheese|veggie/.test(key)) bucket = FALLBACK_FOOD.hamb!
  else if (/beb|coca|suco|cerveja|drink|refri/.test(key)) bucket = FALLBACK_FOOD.beb!
  else if (/sobr|brownie|shake|doce|dessert/.test(key)) bucket = FALLBACK_FOOD.sobr!
  else if (/porc|batata|onion|nugget|frita|side/.test(key)) bucket = FALLBACK_FOOD.porc!
  return bucket[hashIndex(name, bucket.length)]!
}

export function mapAddonGroups(groups: ApiAddonGroup[] | undefined): AddonGroup[] {
  if (!groups?.length) return []
  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    min: g.minQuantity,
    max: g.maxQuantity,
    required: g.isRequired,
    addons: g.additionals.map((a) => ({
      id: a.id,
      name: a.name,
      price: a.price,
      isAvailable: a.isAvailable ?? true,
    })),
  }))
}

export function mapProduct(
  p: ApiProductSummary | ApiProductDetail,
  categoryName?: string,
): Product {
  const detail = p as ApiProductDetail
  const fromGallery = detail.images?.[0]?.url
  return {
    id: p.id,
    categoryId: p.categoryId,
    name: p.name,
    description: p.description ?? '',
    price: p.price,
    promoPrice: p.promoPrice,
    imageUrl: p.imageUrl || fromGallery || pickFallback(p.name, categoryName),
    prepTimeMinutes: p.prepTimeMinutes,
    isAvailable: p.isAvailable,
    isFeatured: p.isFeatured,
    hasAdditionals: p.hasAdditionals || Boolean(detail.additionalGroups?.length),
    addonGroups: mapAddonGroups(detail.additionalGroups),
  }
}

function mapStore(api: ApiMenuResponse['establishment'], isOpen: boolean): Store {
  // No admin: primary = accento da marca, secondary = tom escuro.
  // No cardápio: primary = fundo (ink), secondary = accento (brass).
  const ink = api.secondaryColor || '#0C0B0A'
  const brass = api.primaryColor || '#D4A574'

  const images: StoreImage[] = []
  if (api.bannerUrl) {
    images.push({
      id: 'banner',
      url: api.bannerUrl,
      alt: `${api.name} — ambiente`,
      label: 'Ambiente',
    })
  }
  if (api.logoUrl && images.length === 0) {
    images.push({
      id: 'logo-hero',
      url: api.logoUrl,
      alt: api.name,
      label: 'Marca',
    })
  }
  if (images.length === 0) {
    images.push(...structuredClone(mockMenu.store.images))
  }

  const description = api.description ?? ''
  const tagline =
    description.split(/[.!?]/)[0]?.trim() || 'Uma experiência para saborear'

  return {
    id: api.id,
    name: api.name,
    slug: api.slug,
    tagline,
    description,
    phone: api.phone ?? '',
    whatsapp: api.whatsapp ?? '',
    address: api.address ?? '',
    logoUrl: api.logoUrl,
    primaryColor: ink,
    secondaryColor: brass,
    accentColor: '#F0EBE3',
    isOpen,
    images,
  }
}

function buildPromotions(products: Product[]): Promotion[] {
  return products
    .filter((p) => p.promoPrice != null && p.promoPrice < p.price)
    .slice(0, 6)
    .map((p) => {
      const discount = Math.round((1 - p.promoPrice! / p.price) * 100)
      return {
        id: `promo-${p.id}`,
        title: p.name,
        subtitle: 'Preço especial',
        description: p.description,
        imageUrl: p.imageUrl,
        originalPrice: p.price,
        promoPrice: p.promoPrice!,
        discountPercent: discount,
        validUntil: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        productIds: [p.id],
        ctaLabel: 'Aproveitar',
      }
    })
}

export function mapMenuResponse(data: ApiMenuResponse): MenuData {
  const categoryNameById = new Map(data.categories.map((c) => [c.id, c.name]))

  const categories: Category[] = data.categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    imageUrl: cat.imageUrl,
    sortOrder: cat.sortOrder,
    products: cat.products.map((p) => mapProduct(p, cat.name)),
  }))

  const featuredProducts =
    data.featuredProducts?.length > 0
      ? data.featuredProducts.map((p) =>
          mapProduct(p, categoryNameById.get(p.categoryId)),
        )
      : categories.flatMap((c) => c.products).filter((p) => p.isFeatured)

  const allProducts = categories.flatMap((c) => c.products)

  return {
    store: mapStore(
      data.establishment,
      data.openStatus?.isOpenNow ?? data.establishment.isOpen,
    ),
    categories,
    featuredProducts,
    promotions: buildPromotions(allProducts),
  }
}
