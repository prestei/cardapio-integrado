import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'

interface PlaceholderPageProps {
  title: string
  description: string
  icon: LucideIcon
}

export function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
        <EmptyState
          icon={icon}
          title="Em breve"
          description="Esta funcionalidade está sendo desenvolvida e estará disponível em uma próxima atualização."
          action={{
            label: 'Voltar ao início',
            onClick: () => { window.location.href = '/' },
          }}
        />
        <div className="border-t border-border px-6 pb-6 text-center">
          <Button variant="outline" onClick={() => { window.location.href = '/' }}>
            Ir para o dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
