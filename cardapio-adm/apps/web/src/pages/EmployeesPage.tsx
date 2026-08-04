import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, UserCog, ShieldAlert } from 'lucide-react'
import { usersService } from '@/services/users'
import type { Employee, UpdateEmployeeInput, UserRole } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { ApiError } from '@/services/api'
import { userRoleLabels, formatDate } from '@/utils/format'
import { useAuth } from '@/hooks/useAuth'

const ALL_ROLES: UserRole[] = ['OWNER', 'ADMIN', 'MANAGER', 'ATTENDANT', 'KITCHEN', 'DELIVERY']

const baseSchema = {
  name: z.string().min(1, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'ATTENDANT', 'KITCHEN', 'DELIVERY']),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
}

const createSchema = z.object({
  ...baseSchema,
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
})

const editSchema = z.object({
  ...baseSchema,
  password: z.string().min(6, 'Mínimo de 6 caracteres').optional().or(z.literal('')),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>

export function EmployeesPage() {
  const { user: currentUser } = useAuth()
  const isOwner = currentUser?.role === 'OWNER'
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Employee | null>(null)
  const queryClient = useQueryClient()

  const { data: employees = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: usersService.list,
  })

  const activeOwnersCount = useMemo(
    () => employees.filter((e) => e.role === 'OWNER' && e.isActive).length,
    [employees],
  )

  const roleOptions = ALL_ROLES.filter((r) => r !== 'OWNER' || isOwner).map((r) => ({
    value: r,
    label: userRoleLabels[r],
  }))

  const schema = editing ? editSchema : createSchema
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm | EditForm>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'ATTENDANT', isActive: true },
  })

  const createMutation = useMutation({
    mutationFn: usersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeInput }) =>
      usersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: usersService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeleteConfirm(null)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersService.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const isLastOwner = (employee: Employee) => employee.role === 'OWNER' && activeOwnersCount <= 1

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', email: '', password: '', role: 'ATTENDANT', phone: '', isActive: true })
    setModalOpen(true)
  }

  const openEdit = (employee: Employee) => {
    setEditing(employee)
    reset({
      name: employee.name,
      email: employee.email,
      password: '',
      role: employee.role,
      phone: employee.phone || '',
      isActive: employee.isActive,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    reset()
  }

  const onSubmit = async (data: CreateForm | EditForm) => {
    try {
      if (editing) {
        const payload: UpdateEmployeeInput = {
          name: data.name,
          email: data.email,
          role: isLastOwner(editing) ? 'OWNER' : data.role,
          phone: data.phone,
          isActive: isLastOwner(editing) ? true : data.isActive,
        }
        if (data.password) payload.password = data.password
        await updateMutation.mutateAsync({ id: editing.id, data: payload })
      } else {
        const createData = data as CreateForm
        await createMutation.mutateAsync({
          name: createData.name,
          email: createData.email,
          password: createData.password,
          role: createData.role,
          phone: createData.phone,
          isActive: createData.isActive,
        })
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erro ao salvar'
      setError('root', { message })
    }
  }

  const editingIsLastOwner = editing ? isLastOwner(editing) : false

  return (
    <div>
      <PageHeader
        title="Funcionários"
        description="Gerencie equipe e permissões"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo funcionário
          </Button>
        }
      />

      {isLoading && <TableSkeleton rows={5} />}

      {error && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center text-danger">
          Erro ao carregar funcionários
        </div>
      )}

      {!isLoading && !error && employees.length === 0 && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
          <EmptyState
            icon={UserCog}
            title="Nenhum funcionário"
            description="Adicione membros da sua equipe para colaborar na gestão."
            action={{ label: 'Novo funcionário', onClick: openCreate }}
          />
        </div>
      )}

      {!isLoading && employees.length > 0 && (
        <div className="space-y-2">
          {employees.map((employee) => {
            const lastOwner = isLastOwner(employee)
            return (
              <div
                key={employee.id}
                className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 sm:flex-row sm:items-center"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-muted text-sm font-medium text-accent">
                  {employee.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-text">{employee.name}</h3>
                    <Badge variant={employee.isActive ? 'success' : 'muted'}>
                      {employee.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge variant="accent">{userRoleLabels[employee.role]}</Badge>
                    {lastOwner && (
                      <Badge variant="warning" className="flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" /> Único proprietário
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted">{employee.email}</p>
                  <p className="text-xs text-muted">
                    {employee.phone ? `${employee.phone} · ` : ''}Desde {formatDate(employee.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={lastOwner}
                    title={lastOwner ? 'Não é possível desativar o único proprietário' : undefined}
                    onClick={() =>
                      toggleMutation.mutate({ id: employee.id, isActive: !employee.isActive })
                    }
                  >
                    {employee.isActive ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(employee)} aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={lastOwner}
                    title={lastOwner ? 'Não é possível excluir o único proprietário' : undefined}
                    onClick={() => setDeleteConfirm(employee)}
                    aria-label="Excluir"
                    className="text-danger hover:text-danger disabled:text-muted"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar funcionário' : 'Novo funcionário'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome" error={errors.name?.message} {...register('name')} />
          <Input label="E-mail" type="email" error={errors.email?.message} {...register('email')} />
          {!editing && (
            <Input
              label="Senha"
              type="password"
              error={errors.password?.message}
              {...register('password')}
            />
          )}
          {editing && (
            <Input
              label="Nova senha"
              type="password"
              hint="Deixe em branco para manter a senha atual"
              error={errors.password?.message}
              {...register('password')}
            />
          )}
          <Input label="Telefone" {...register('phone')} />
          <Select
            label="Cargo"
            options={roleOptions}
            error={errors.role?.message}
            disabled={editingIsLastOwner}
            {...register('role')}
          />
          <label className="flex items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              disabled={editingIsLastOwner}
              {...register('isActive')}
              className="rounded border-border"
            />
            Funcionário ativo
          </label>
          {editingIsLastOwner && (
            <p className="text-xs text-muted">
              Este é o único proprietário ativo — cargo e status não podem ser alterados até que
              outro proprietário seja definido.
            </p>
          )}
          {errors.root && <p className="text-sm text-danger">{errors.root.message}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editing ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Excluir funcionário"
        size="sm"
      >
        <p className="text-sm text-muted">
          Excluir <strong className="text-text">{deleteConfirm?.name}</strong>? Esta ação não pode
          ser desfeita.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button
            variant="danger"
            isLoading={deleteMutation.isPending}
            onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
          >
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  )
}
