import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'motion/react'
import { CheckCircle, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { ApiError } from '@/services/api'
import { authService } from '@/services/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const schema = z
  .object({
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    if (!token) {
      setError('root', { message: 'Token inválido ou expirado' })
      return
    }

    try {
      await authService.resetPassword({ token, password: data.password })
      setSuccess(true)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Erro ao redefinir senha'
      setError('root', { message })
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link
          to="/login"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao login
        </Link>

        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-md">
          {success ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <h1 className="font-display text-xl font-semibold text-text">
                Senha redefinida
              </h1>
              <p className="mt-2 text-sm text-muted">
                Sua senha foi alterada com sucesso.
              </p>
              <Link to="/login">
                <Button className="mt-6 w-full">Ir para login</Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-xl font-semibold text-text">
                Nova senha
              </h1>
              <p className="mt-1 text-sm text-muted">
                Digite sua nova senha abaixo
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                <Input
                  label="Nova senha"
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
                  Redefinir senha
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
