import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CartAddon, CartItem, Product } from '@/types'
import { cartItemKey, productPrice } from '@/utils'

interface AddToCartInput {
  product: Product
  quantity: number
  addons?: CartAddon[]
  notes?: string
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
  removeItem: (key: string) => void
  updateQuantity: (key: string, quantity: number) => void
  clear: () => void
  lastAddedAt: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [lastAddedAt, setLastAddedAt] = useState(0)

  const addItem = useCallback(({ product, quantity, addons = [], notes }: AddToCartInput) => {
    const key = cartItemKey(
      product.id,
      addons.map((a) => ({ id: a.id, quantity: a.quantity })),
      notes,
    )
    const unitPrice =
      productPrice(product) +
      addons.reduce((sum, a) => sum + a.price * a.quantity, 0)

    setItems((prev) => {
      const existing = prev.find((i) => i.key === key)
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + quantity } : i,
        )
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          unitPrice,
          quantity,
          notes,
          addons,
        },
      ]
    })
    setLastAddedAt(Date.now())
  }, [])

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key))
  }, [])

  const updateQuantity = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.key !== key))
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, quantity } : i)),
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((s, i) => s + i.quantity, 0)
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    return {
      items,
      itemCount,
      subtotal,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      toggleCart: () => setIsOpen((o) => !o),
      addItem,
      removeItem,
      updateQuantity,
      clear,
      lastAddedAt,
    }
  }, [items, isOpen, addItem, removeItem, updateQuantity, clear, lastAddedAt])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
