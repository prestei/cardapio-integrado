import { api, setToken, clearToken } from './api'
import type {
  AuthResponse,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  User,
} from '@/types'

export const authService = {
  login: async (input: LoginInput): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', input)
    setToken(response.token)
    return response
  },

  register: async (input: RegisterInput): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', input)
    setToken(response.token)
    return response
  },

  forgotPassword: (input: ForgotPasswordInput) =>
    api.post<{ message: string; resetToken?: string }>('/auth/forgot-password', input),

  resetPassword: (input: ResetPasswordInput) =>
    api.post<{ message: string }>('/auth/reset-password', input),

  me: () => api.get<User>('/auth/me'),

  logout: () => {
    clearToken()
  },
}
