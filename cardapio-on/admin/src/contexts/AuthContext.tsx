import { useEffect, useState, useCallback, type ReactNode } from 'react'
import { authService } from '@/services/auth'
import type { LoginInput, RegisterInput, User } from '@/types'
import { AuthContext } from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const me = await authService.me()
      setUser(me)
    } catch {
      authService.logout()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = async (input: LoginInput) => {
    const response = await authService.login(input)
    setUser(response.user)
    return response
  }

  const register = async (input: RegisterInput) => {
    const response = await authService.register(input)
    setUser(response.user)
    return response
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
