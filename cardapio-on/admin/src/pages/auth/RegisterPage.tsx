import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'motion/react'
import { ApiError } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string(),
    establishmentName: z.string().min(2, 'Nome do estabelecimento obrigatório'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  })

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const { register: registerUser } = useAuth()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        establishmentName: data.establishmentName,
      })
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Erro ao criar conta'
      setError('root', { message })
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-semibold text-text">
            Criar conta
          </h1>
          <p className="mt-2 text-sm text-muted">
            Comece a gerenciar seu cardápio online
          </p>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-md">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Seu nome"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Nome do estabelecimento"
              error={errors.establishmentName?.message}
              {...register('establishmentName')}
            />
            <Input
              label="Senha"
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirmar senha"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            {errors.root && (
              <p className="text-sm text-danger" role="alert">
                {errors.root.message}
              </p>
            )}

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Criar conta
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Já tem conta?{' '}
            <Link to="/login" className="text-accent hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
