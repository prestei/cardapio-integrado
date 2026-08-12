import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Menu,
  Search,
  Bell,
  ExternalLink,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/utils/cn'
import { useAuth } from '@/hooks/useAuth'
import { ordersService } from '@/services/orders'
interface HeaderProps {
  onMenuClick: () => void
  sidebarCollapsed: boolean
}

export function Header({ onMenuClick, sidebarCollapsed }: HeaderProps) {
  const { user, logout } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { data: newOrders = [] } = useQuery({
    queryKey: ['orders', 'new-count'],
    queryFn: () => ordersService.list({ status: 'NEW' }),
    refetchInterval: 30000,
    enabled: !!user,
  })

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const publicMenuBase = (
    import.meta.env.VITE_PUBLIC_MENU_URL as string | undefined
  )?.replace(/\/$/, '')

  const publicMenuUrl =
    user?.establishment?.slug && publicMenuBase
      ? `${publicMenuBase}/${user.establishment.slug}`
      : user?.establishment?.slug
        ? `http://localhost:5177/${user.establishment.slug}`
        : '#'

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-bg/95 px-4 backdrop-blur-sm transition-all lg:px-6',
        sidebarCollapsed ? 'lg:pl-[84px]' : 'lg:pl-[280px]',
      )}
    >
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-[var(--radius-md)] p-2 text-muted hover:bg-elevated hover:text-text lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative hidden flex-1 sm:block sm:max-w-md">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Buscar pedidos, produtos..."
          className={cn(
            'h-9 w-full rounded-[var(--radius-md)] border border-border bg-surface pl-9 pr-3 text-sm text-text',
            'placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
            searchOpen && 'ring-1 ring-accent',
          )}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => setSearchOpen(false)}
          aria-label="Busca global"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {newOrders.length > 0 && (
          <Link
            to="/pedidos?status=NEW"
            className="relative rounded-[var(--radius-md)] p-2 text-muted hover:bg-elevated hover:text-text"
            aria-label={`${newOrders.length} novos pedidos`}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-bg">
              {newOrders.length > 9 ? '9+' : newOrders.length}
            </span>
          </Link>
        )}

        {!newOrders.length && (
          <button
            type="button"
            className="rounded-[var(--radius-md)] p-2 text-muted hover:bg-elevated hover:text-text"
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5" />
          </button>
        )}

        <a
          href={publicMenuUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={publicMenuUrl === '#'}
          className={cn(
            'hidden items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-2 text-sm sm:flex',
            publicMenuUrl === '#'
              ? 'pointer-events-none text-muted/40'
              : 'text-muted hover:bg-elevated hover:text-text',
          )}
          title={
            user?.establishment?.slug
              ? `Abrir cardápio público (${user.establishment.slug})`
              : 'Cardápio público indisponível'
          }
        >
          <ExternalLink className="h-4 w-4" />
          <span>Ver cardápio</span>
        </a>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 text-sm hover:bg-elevated"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-muted text-sm font-medium text-accent">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-text md:block">{user?.name?.split(' ')[0]}</span>
            <ChevronDown className="hidden h-4 w-4 text-muted md:block" />
          </button>

          {userMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-52 rounded-[var(--radius-md)] border border-border bg-surface py-1 shadow-lg"
              role="menu"
            >
              <div className="border-b border-border px-4 py-2">
                <p className="text-sm font-medium text-text">{user?.name}</p>
                <p className="text-xs text-muted">{user?.email}</p>
              </div>
              <Link
                to="/conta"
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:bg-elevated hover:text-text"
                role="menuitem"
                onClick={() => setUserMenuOpen(false)}
              >
                <User className="h-4 w-4" />
                Minha conta
              </Link>
              <Link
                to="/configuracoes"
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:bg-elevated hover:text-text"
                role="menuitem"
                onClick={() => setUserMenuOpen(false)}
              >
                <Settings className="h-4 w-4" />
                Configurações
              </Link>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false)
                  logout()
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-elevated"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
