import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'motion/react'
import { ApiError } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import type { LoginInput } from '@/types'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { LoginBackground } from '@/components/auth/LoginBackground'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data as LoginInput)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Erro ao fazer login'
      setError('root', { message })
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-bg px-4">
      <LoginBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-semibold text-text">
            Cardápio
          </h1>
          <p className="mt-2 text-sm text-muted">
            Acesse o painel do seu estabelecimento
          </p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Senha"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            {errors.root && (
              <p className="text-sm text-danger" role="alert">
                {errors.root.message}
              </p>
            )}

            <div className="flex items-center justify-end">
              <Link
                to="/recuperar-senha"
                className="text-sm text-accent hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Entrar
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Não tem conta?{' '}
            <Link to="/cadastro" className="text-accent hover:underline">
              Criar conta
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted/70">
          Demo: dono@demo.com / demo1234
        </p>
      </motion.div>
    </div>
  )
}
