import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, QrCode as QrCodeIcon, Copy, Printer, Check, ExternalLink, Eye, EyeOff } from 'lucide-react'
import { qrCodesService, buildQrImageUrl } from '@/services/qrCodes'
import { useAuth } from '@/hooks/useAuth'
import type { QrCodeEntry, QrCodeKind } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { QrDisplayCard, buildQrPrintDocument, qrCardFooter } from '@/components/qr/QrDisplayCard'

const KIND_OPTIONS: { value: QrCodeKind; label: string }[] = [
  { value: 'MENU', label: 'Cardápio' },
  { value: 'TABLE', label: 'Mesa' },
  { value: 'COUNTER', label: 'Balcão' },
  { value: 'SHOWCASE', label: 'Vitrine' },
  { value: 'SOCIAL', label: 'Redes sociais' },
]

const kindLabels: Record<QrCodeKind, string> = {
  MENU: 'Cardápio',
  TABLE: 'Mesa',
  COUNTER: 'Balcão',
  SHOWCASE: 'Vitrine',
  SOCIAL: 'Redes sociais',
}

const qrSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  kind: z.enum(['MENU', 'TABLE', 'COUNTER', 'SHOWCASE', 'SOCIAL']),
  targetPath: z.string().optional(),
  tableLabel: z.string().optional(),
  isActive: z.boolean().optional(),
})

type QrForm = z.infer<typeof qrSchema>

export function QrCodesPage() {
  const { user } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<QrCodeEntry | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<QrCodeEntry | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: qrCodes = [], isLoading, error } = useQuery({
    queryKey: ['qr-codes'],
    queryFn: qrCodesService.list,
  })

  const publicBase = (import.meta.env.VITE_PUBLIC_MENU_URL as string | undefined)?.replace(/\/$/, '') || ''
  const slug = user?.establishment?.slug || ''

  const buildTargetUrl = (qr: Pick<QrCodeEntry, 'kind' | 'targetPath' | 'tableLabel'>) => {
    const base = slug ? `${publicBase}/${slug}` : publicBase
    if (qr.targetPath) {
      return `${base}${qr.targetPath.startsWith('/') ? '' : '/'}${qr.targetPath}`
    }
    if (qr.kind === 'TABLE' && qr.tableLabel) {
      return `${base}?mesa=${encodeURIComponent(qr.tableLabel)}`
    }
    return base
  }

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<QrForm>({
    resolver: zodResolver(qrSchema),
    defaultValues: { kind: 'MENU', isActive: true },
  })

  const kind = watch('kind')

  const createMutation = useMutation({
    mutationFn: qrCodesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: QrForm }) => qrCodesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: qrCodesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qr-codes'] })
      setDeleteConfirm(null)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      qrCodesService.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qr-codes'] }),
  })

  const openCreate = () => {
    setEditing(null)
    reset({ name: '', kind: 'MENU', targetPath: '', tableLabel: '', isActive: true })
    setModalOpen(true)
  }

  const openEdit = (qr: QrCodeEntry) => {
    setEditing(qr)
    reset({
      name: qr.name,
      kind: qr.kind,
      targetPath: qr.targetPath || '',
      tableLabel: qr.tableLabel || '',
      isActive: qr.isActive,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    reset()
  }

  const onSubmit = async (data: QrForm) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data })
      } else {
        await createMutation.mutateAsync({
          name: data.name,
          kind: data.kind,
          targetPath: data.targetPath,
          tableLabel: data.tableLabel,
          isActive: data.isActive,
        })
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Erro ao salvar'
      setError('root', { message })
    }
  }

  const copyLink = async (qr: QrCodeEntry) => {
    await navigator.clipboard.writeText(buildTargetUrl(qr))
    setCopiedId(qr.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const venueName = user?.establishment?.name || 'Casa'

  const printQr = (qr: QrCodeEntry) => {
    const url = buildTargetUrl(qr)
    const imgUrl = buildQrImageUrl(url, 480)
    const win = window.open('', '_blank', 'width=520,height=720')
    if (!win) return
    win.document.write(
      buildQrPrintDocument({
        title: venueName,
        imageUrl: imgUrl,
        footer: qrCardFooter(qr),
      }),
    )
    win.document.close()
  }

  return (
    <div>
      <PageHeader
        title="QR Codes"
        description="Gere QR Codes para mesas, balcão e cardápio digital"
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo QR Code
          </Button>
        }
      />

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center text-danger">
          Erro ao carregar QR Codes
        </div>
      )}

      {!isLoading && !error && qrCodes.length === 0 && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
          <EmptyState
            icon={QrCodeIcon}
            title="Nenhum QR Code"
            description="Crie QR Codes para facilitar o acesso ao seu cardápio digital."
            action={{ label: 'Novo QR Code', onClick: openCreate }}
          />
        </div>
      )}

      {!isLoading && qrCodes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {qrCodes.map((qr) => {
            const url = buildTargetUrl(qr)
            const imgUrl = buildQrImageUrl(url, 240)
            return (
              <div
                key={qr.id}
                className="flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface"
              >
                {qr.isActive ? (
                  <QrDisplayCard
                    qr={qr}
                    imageUrl={imgUrl}
                    venueName={venueName}
                  />
                ) : (
                  <div className="relative">
                    <div className="pointer-events-none opacity-40 grayscale">
                      <QrDisplayCard
                        qr={qr}
                        imageUrl={imgUrl}
                        venueName={venueName}
                      />
                    </div>
                    <div className="absolute inset-0 grid place-items-center bg-bg/50">
                      <Badge variant="muted">Inativo</Badge>
                    </div>
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium text-text">{qr.name}</h3>
                    {qr.isActive ? (
                      <Badge variant="success">Ativo</Badge>
                    ) : (
                      <Badge variant="muted">Inativo</Badge>
                    )}
                  </div>
                  <Badge variant="accent" className="w-fit">
                    {kindLabels[qr.kind]}
                    {qr.tableLabel ? ` · ${qr.tableLabel}` : ''}
                  </Badge>
                  <p className="truncate text-xs text-muted" title={url}>
                    {url}
                  </p>

                  <div className="mt-auto flex flex-wrap items-center gap-1 pt-2">
                    <Button variant="ghost" size="sm" onClick={() => copyLink(qr)}>
                      {copiedId === qr.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedId === qr.id ? 'Copiado' : 'Copiar'}
                    </Button>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 text-sm text-muted hover:bg-elevated hover:text-text"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <a
                      href={buildQrImageUrl(url, 512)}
                      download={`${qr.name}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 text-sm text-muted hover:bg-elevated hover:text-text"
                      aria-label="Baixar QR Code"
                    >
                      Baixar
                    </a>
                    <Button variant="ghost" size="icon" onClick={() => printQr(qr)} aria-label="Imprimir">
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(qr)} aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleMutation.mutate({ id: qr.id, isActive: !qr.isActive })}
                      aria-label={qr.isActive ? 'Desativar' : 'Ativar'}
                    >
                      {qr.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteConfirm(qr)}
                      aria-label="Excluir"
                      className="text-danger hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar QR Code' : 'Novo QR Code'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nome" placeholder="Ex: Mesa 1, Cardápio principal" error={errors.name?.message} {...register('name')} />
          <Select label="Tipo" options={KIND_OPTIONS} error={errors.kind?.message} {...register('kind')} />
          {kind === 'TABLE' && (
            <Input label="Identificação da mesa" placeholder="Ex: 5" {...register('tableLabel')} />
          )}
          <Input
            label="Caminho de destino"
            placeholder="/categoria/bebidas"
            hint="Opcional — deixe em branco para apontar para o cardápio principal"
            {...register('targetPath')}
          />
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" {...register('isActive')} className="rounded border-border" />
            QR Code ativo
          </label>
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
        title="Excluir QR Code"
        size="sm"
      >
        <p className="text-sm text-muted">
          Excluir <strong className="text-text">{deleteConfirm?.name}</strong>?
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
