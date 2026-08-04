import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'motion/react'
import { ArrowLeft, Mail } from 'lucide-react'
import { ApiError } from '@/services/api'
import { authService } from '@/services/auth'
import type { ForgotPasswordInput } from '@/types'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await authService.forgotPassword(data as ForgotPasswordInput)
      setSent(true)
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Erro ao enviar e-mail'
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
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted">
                <Mail className="h-5 w-5 text-accent" />
              </div>
              <h1 className="font-display text-xl font-semibold text-text">
                E-mail enviado
              </h1>
              <p className="mt-2 text-sm text-muted">
                Se o e-mail estiver cadastrado, você receberá instruções para
                redefinir sua senha.
              </p>
            </div>
          ) : (
            <>
              <h1 className="font-display text-xl font-semibold text-text">
                Recuperar senha
              </h1>
              <p className="mt-1 text-sm text-muted">
                Informe seu e-mail para receber o link de recuperação
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                <Input
                  label="E-mail"
                  type="email"
                  autoComplete="email"
                  error={errors.email?.message}
                  {...register('email')}
                />

                {errors.root && (
                  <p className="text-sm text-danger" role="alert">
                    {errors.root.message}
                  </p>
                )}

                <Button type="submit" className="w-full" isLoading={isSubmitting}>
                  Enviar link
                </Button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
