import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import type { MenuData } from '@/types'

interface MenuContextValue {
  slug: string
  data: MenuData
}

const MenuContext = createContext<MenuContextValue | null>(null)

export function MenuProvider({
  slug,
  data,
  children,
}: {
  slug: string
  data: MenuData
  children: ReactNode
}) {
  const value = useMemo(() => ({ slug, data }), [slug, data])
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}

export function useMenu() {
  const ctx = useContext(MenuContext)
  if (!ctx) throw new Error('useMenu must be used within MenuProvider')
  return ctx
}
