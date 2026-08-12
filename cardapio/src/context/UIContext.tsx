import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Product } from '@/types'

interface ProductPanelState {
  product: Product | null
  originRect: DOMRect | null
}

interface UIContextValue {
  searchOpen: boolean
  openSearch: () => void
  closeSearch: () => void
  productPanel: ProductPanelState
  openProduct: (product: Product, origin?: HTMLElement | null) => void
  closeProduct: () => void
  activeSection: string
  setActiveSection: (id: string) => void
}

const UIContext = createContext<UIContextValue | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('loja')
  const [productPanel, setProductPanel] = useState<ProductPanelState>({
    product: null,
    originRect: null,
  })

  const openProduct = useCallback((product: Product, origin?: HTMLElement | null) => {
    setProductPanel({
      product,
      originRect: origin?.getBoundingClientRect() ?? null,
    })
  }, [])

  const closeProduct = useCallback(() => {
    setProductPanel({ product: null, originRect: null })
  }, [])

  const value = useMemo(
    () => ({
      searchOpen,
      openSearch: () => setSearchOpen(true),
      closeSearch: () => setSearchOpen(false),
      productPanel,
      openProduct,
      closeProduct,
      activeSection,
      setActiveSection,
    }),
    [searchOpen, productPanel, openProduct, closeProduct, activeSection],
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
