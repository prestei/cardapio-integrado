import { createContext } from 'react'
import type { LoginInput, RegisterInput, User } from '@/types'

export interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<unknown>
  register: (input: RegisterInput) => Promise<unknown>
  logout: () => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
