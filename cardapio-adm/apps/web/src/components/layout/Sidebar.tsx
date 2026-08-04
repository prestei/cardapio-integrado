import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  FolderOpen,
  Package,
  PlusCircle,
  Ticket,
  Users,
  Truck,
  QrCode,
  BarChart3,
  UserCog,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  X,
  Megaphone,
  Wallet,
  ChefHat,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types'

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onToggleCollapse: () => void
  onCloseMobile: () => void
}

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
  roles?: UserRole[]
}

const navItems: NavItem[] = [
  { to: '/', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/pedidos', label: 'Pedidos', icon: ShoppingBag },
  { to: '/cardapio', label: 'Cardápio', icon: UtensilsCrossed },
  { to: '/categorias', label: 'Categorias', icon: FolderOpen },
  { to: '/produtos', label: 'Produtos', icon: Package },
  { to: '/adicionais', label: 'Adicionais', icon: PlusCircle },
  { to: '/cozinha', label: 'Cozinha', icon: ChefHat, roles: ['OWNER', 'ADMIN', 'MANAGER', 'KITCHEN'] },
  { to: '/caixa', label: 'Caixa', icon: Wallet, roles: ['OWNER', 'ADMIN', 'MANAGER', 'ATTENDANT'] },
  { to: '/marketing', label: 'Marketing', icon: Megaphone, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { to: '/cupons', label: 'Cupons', icon: Ticket, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { to: '/clientes', label: 'Clientes', icon: Users, roles: ['OWNER', 'ADMIN', 'MANAGER', 'ATTENDANT'] },
  { to: '/entregas', label: 'Entregas', icon: Truck, roles: ['OWNER', 'ADMIN', 'MANAGER', 'ATTENDANT', 'DELIVERY'] },
  { to: '/qr-codes', label: 'QR Codes', icon: QrCode, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { to: '/funcionarios', label: 'Funcionários', icon: UserCog, roles: ['OWNER', 'ADMIN'] },
  { to: '/configuracoes', label: 'Configurações', icon: Settings, roles: ['OWNER', 'ADMIN'] },
  { to: '/suporte', label: 'Suporte', icon: HelpCircle },
]

export function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: SidebarProps) {
  const { user } = useAuth()
  const location = useLocation()
  const establishment = user?.establishment
  const visibleNavItems = navItems.filter(
    (item) => !item.roles || !user || item.roles.includes(user.role),
  )

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold text-accent">Cardápio</p>
            {establishment && (
              <p className="truncate text-xs text-muted">{establishment.name}</p>
            )}
          </div>
        )}
        {collapsed && (
          <span className="mx-auto font-display text-lg font-semibold text-accent">C</span>
        )}
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-[var(--radius-sm)] p-1.5 text-muted hover:bg-elevated hover:text-text lg:hidden"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {establishment && !collapsed && (
        <div className="border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Badge variant="accent">{establishment.plan || 'Pro'}</Badge>
            <Badge variant={establishment.isOpen ? 'success' : 'muted'}>
              {establishment.isOpen ? 'Aberto' : 'Fechado'}
            </Badge>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Menu principal">
        <ul className="space-y-0.5">
          {visibleNavItems.map(({ to, label, icon: Icon, end }) => {
            const isActive = end
              ? location.pathname === to
              : location.pathname.startsWith(to) && to !== '/'

            return (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={onCloseMobile}
                  className={cn(
                    'group flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm transition-colors',
                    'hover:bg-elevated hover:text-text',
                    isActive
                      ? 'bg-accent-muted text-accent font-medium'
                      : 'text-muted',
                    collapsed && 'justify-center px-2',
                  )}
                  title={collapsed ? label : undefined}
                >
                  <Icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0',
                      isActive ? 'text-accent' : 'text-muted group-hover:text-text',
                    )}
                    aria-hidden="true"
                  />
                  {!collapsed && <span>{label}</span>}
                  {isActive && !collapsed && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="hidden border-t border-border p-2 lg:block">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-sm text-muted transition-colors hover:bg-elevated hover:text-text"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Recolher</span>
            </>
          )}
        </button>
      </div>
    </>
  )

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-surface transition-all duration-200',
          collapsed ? 'w-[68px]' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
