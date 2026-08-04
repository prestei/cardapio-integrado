import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addFavorite, listFavorites, removeFavorite } from '@/services/favorites'
import { usePhoneStorage } from '@/hooks/usePhoneStorage'
import { isValidPhone } from '@/utils/validators'
import { PhonePromptModal } from '@/components/PhonePromptModal'
import type { FavoriteItem } from '@/types'

interface FavoritesContextValue {
  phone: string
  favorites: FavoriteItem[]
  isLoadingFavorites: boolean
  isFavorite: (productId: string) => boolean
  toggleFavorite: (productId: string) => void
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const [phone, setPhone] = usePhoneStorage(slug)
  const [promptOpen, setPromptOpen] = useState(false)
  const [pendingProductId, setPendingProductId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const hasPhone = Boolean(phone && isValidPhone(phone))

  const query = useQuery({
    queryKey: ['favorites', slug, phone],
    queryFn: () => listFavorites(slug, phone),
    enabled: Boolean(slug) && hasPhone,
  })

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['favorites', slug, phone] }),
    [queryClient, slug, phone],
  )

  const addMutation = useMutation({
    mutationFn: (productId: string) => addFavorite(slug, phone, productId),
    onSuccess: invalidate,
  })

  const removeMutation = useMutation({
    mutationFn: (productId: string) => removeFavorite(slug, phone, productId),
    onSuccess: invalidate,
  })

  const favoriteIds = useMemo(
    () => new Set((query.data ?? []).map((f) => f.productId)),
    [query.data],
  )

  const toggleFavorite = useCallback(
    (productId: string) => {
      if (!hasPhone) {
        setPendingProductId(productId)
        setPromptOpen(true)
        return
      }
      if (favoriteIds.has(productId)) {
        removeMutation.mutate(productId)
      } else {
        addMutation.mutate(productId)
      }
    },
    [hasPhone, favoriteIds, addMutation, removeMutation],
  )

  const confirmPhone = useCallback(
    (value: string) => {
      setPhone(value)
      setPromptOpen(false)
      if (pendingProductId) {
        const productId = pendingProductId
        setPendingProductId(null)
        void addFavorite(slug, value, productId).then(() =>
          queryClient.invalidateQueries({ queryKey: ['favorites', slug, value] }),
        )
      }
    },
    [pendingProductId, queryClient, setPhone, slug],
  )

  const value = useMemo<FavoritesContextValue>(
    () => ({
      phone,
      favorites: query.data ?? [],
      isLoadingFavorites: query.isLoading,
      isFavorite: (productId: string) => favoriteIds.has(productId),
      toggleFavorite,
    }),
    [phone, query.data, query.isLoading, favoriteIds, toggleFavorite],
  )

  return (
    <FavoritesContext.Provider value={value}>
      {children}
      <PhonePromptModal
        open={promptOpen}
        title="Salvar favorito"
        description="Informe seu telefone para guardar seus produtos favoritos."
        onClose={() => {
          setPromptOpen(false)
          setPendingProductId(null)
        }}
        onConfirm={confirmPhone}
      />
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}
