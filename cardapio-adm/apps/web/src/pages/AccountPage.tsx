import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Pencil, LogOut, Mail, Phone, ShieldCheck, Building2, Check } from 'lucide-react'
import { usersService } from '@/services/users'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ApiError } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { userRoleLabels } from '@/utils/format'

const profileSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  phone: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export function AccountPage() {
  const { user, refreshUser, logout } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [unsupported, setUnsupported] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', phone: user?.phone || '' },
  })

  const mutation = useMutation({
    mutationFn: (data: ProfileForm) => {
      if (!user) throw new Error('Usuário não encontrado')
      return usersService.update(user.id, data)
    },
    onSuccess: async () => {
      await refreshUser()
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const startEdit = () => {
    reset({ name: user?.name || '', phone: user?.phone || '' })
    setUnsupported(false)
    setEditing(true)
  }

  const onSubmit = async (data: ProfileForm) => {
    try {
      await mutation.mutateAsync(data)
    } catch (err) {
      if (err instanceof ApiError && (err.status === 403 || err.status === 404)) {
        setUnsupported(true)
        return
      }
      setError('root', { message: err instanceof ApiError ? err.message : 'Erro ao salvar' })
    }
  }

  if (!user) return null

  return (
    <div>
      <PageHeader title="Minha conta" description="Gerencie seu perfil e preferências" />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 lg:col-span-2">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-muted text-2xl font-semibold text-accent">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-text">{user.name}</h2>
              <Badge variant="accent">{userRoleLabels[user.role]}</Badge>
            </div>
            {!editing && (
              <Button variant="outline" size="sm" className="ml-auto" onClick={startEdit}>
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input label="Nome" error={errors.name?.message} {...register('name')} />
              <Input label="Telefone" {...register('phone')} />
              {unsupported && (
                <p className="text-sm text-muted">
                  A atualização de perfil não está disponível para o seu usuário no momento.
                  Entre em contato com um administrador para alterar seus dados.
                </p>
              )}
              {errors.root && <p className="text-sm text-danger">{errors.root.message}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Salvar
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-text">
                <Mail className="h-4 w-4 text-muted" /> {user.email}
              </div>
              {user.phone && (
                <div className="flex items-center gap-2 text-sm text-text">
                  <Phone className="h-4 w-4 text-muted" /> {user.phone}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-text">
                <ShieldCheck className="h-4 w-4 text-muted" /> {userRoleLabels[user.role]}
              </div>
              {user.establishment && (
                <div className="flex items-center gap-2 text-sm text-text">
                  <Building2 className="h-4 w-4 text-muted" /> {user.establishment.name}
                </div>
              )}
              {saved && (
                <p className="flex items-center gap-1.5 text-sm text-success">
                  <Check className="h-4 w-4" /> Perfil atualizado com sucesso
                </p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
          <h3 className="mb-4 text-sm font-medium text-text">Sessão</h3>
          <p className="mb-4 text-sm text-muted">
            Você está conectado como <strong className="text-text">{user.email}</strong>.
          </p>
          <Button variant="danger" onClick={logout} className="w-full">
            <LogOut className="h-4 w-4" />
            Sair da conta
          </Button>
        </div>
      </div>
    </div>
  )
}
