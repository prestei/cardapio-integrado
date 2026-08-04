import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CartAdditional, CartItem } from '@/types'

interface AddToCartInput {
  productId: string
  name: string
  imageUrl: string | null
  unitPrice: number
  quantity: number
  notes?: string
  additionals: CartAdditional[]
}

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  addItem: (input: AddToCartInput) => void
  updateQuantity: (key: string, quantity: number) => void
  removeItem: (key: string) => void
  clearCart: () => void
  bumpToken: number
}

const CartContext = createContext<CartContextValue | null>(null)

function buildKey(
  productId: string,
  additionals: CartAdditional[],
  notes?: string,
) {
  const addKey = additionals
    .map((a) => `${a.additionalId}:${a.quantity}`)
    .sort()
    .join('|')
  return `${productId}::${addKey}::${notes?.trim() ?? ''}`
}

function itemLineTotal(item: CartItem) {
  const extras = item.additionals.reduce(
    (sum, a) => sum + a.price * a.quantity,
    0,
  )
  return (item.unitPrice + extras) * item.quantity
}

export function CartProvider({
  slug,
  children,
}: {
  slug: string
  children: ReactNode
}) {
  const storageKey = `cardapio-cart:${slug}`
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      return raw ? (JSON.parse(raw) as CartItem[]) : []
    } catch {
      return []
    }
  })
  const [isOpen, setIsOpen] = useState(false)
  const [bumpToken, setBumpToken] = useState(0)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items))
  }, [items, storageKey])

  const addItem = useCallback((input: AddToCartInput) => {
    const key = buildKey(input.productId, input.additionals, input.notes)
    setItems((prev) => {
      const existing = prev.find((item) => item.key === key)
      if (existing) {
        return prev.map((item) =>
          item.key === key
            ? { ...item, quantity: Math.min(99, item.quantity + input.quantity) }
            : item,
        )
      }
      return [
        ...prev,
        {
          key,
          productId: input.productId,
          name: input.name,
          imageUrl: input.imageUrl,
          unitPrice: input.unitPrice,
          quantity: input.quantity,
          notes: input.notes,
          additionals: input.additionals,
        },
      ]
    })
    setBumpToken((n) => n + 1)
    setIsOpen(true)
  }, [])

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.key === key ? { ...item, quantity: Math.max(0, quantity) } : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }, [])

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((item) => item.key !== key))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = items.reduce((sum, item) => sum + itemLineTotal(item), 0)
    return {
      items,
      itemCount,
      subtotal,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      toggleCart: () => setIsOpen((v) => !v),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      bumpToken,
    }
  }, [items, isOpen, addItem, updateQuantity, removeItem, clearCart, bumpToken])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export function getCartItemTotal(item: CartItem) {
  return itemLineTotal(item)
}
