import { useCallback, useState } from 'react'

/**
 * Persiste o telefone do cliente por loja (`cardapio-phone:{slug}`) para
 * reutilizar em favoritos e histórico de pedidos sem exigir login.
 */
export function usePhoneStorage(slug: string) {
  const storageKey = `cardapio-phone:${slug}`
  const [phone, setPhoneState] = useState<string>(() => {
    try {
      return localStorage.getItem(storageKey) ?? ''
    } catch {
      return ''
    }
  })

  const setPhone = useCallback(
    (value: string) => {
      setPhoneState(value)
      try {
        if (value) localStorage.setItem(storageKey, value)
        else localStorage.removeItem(storageKey)
      } catch {
        // localStorage indisponível (ex.: modo privado) — segue apenas em memória
      }
    },
    [storageKey],
  )

  return [phone, setPhone] as const
}
