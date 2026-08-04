import { Routes, Route, Navigate } from 'react-router-dom'
import { AdminLayout } from '@/layouts/AdminLayout'
import { ProtectedRoute, PublicRoute } from '@/routes/Guards'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { CardapioPage } from '@/pages/CardapioPage'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import {
  PlusCircle,
  Ticket,
  Users,
  Truck,
  BarChart3,
  UserCog,
  Settings,
  HelpCircle,
  User,
} from 'lucide-react'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="pedidos" element={<OrdersPage />} />
          <Route path="cardapio" element={<CardapioPage />} />
          <Route path="categorias" element={<CategoriesPage />} />
          <Route path="produtos" element={<ProductsPage />} />
          <Route
            path="adicionais"
            element={
              <PlaceholderPage
                title="Adicionais"
                description="Gerencie grupos de adicionais e complementos"
                icon={PlusCircle}
              />
            }
          />
          <Route
            path="cupons"
            element={
              <PlaceholderPage
                title="Cupons"
                description="Crie e gerencie cupons de desconto"
                icon={Ticket}
              />
            }
          />
          <Route
            path="clientes"
            element={
              <PlaceholderPage
                title="Clientes"
                description="Visualize e gerencie sua base de clientes"
                icon={Users}
              />
            }
          />
          <Route
            path="entregas"
            element={
              <PlaceholderPage
                title="Entregas"
                description="Acompanhe entregas e entregadores"
                icon={Truck}
              />
            }
          />
          <Route
            path="relatorios"
            element={
              <PlaceholderPage
                title="Relatórios"
                description="Relatórios detalhados e exportações"
                icon={BarChart3}
              />
            }
          />
          <Route
            path="funcionarios"
            element={
              <PlaceholderPage
                title="Funcionários"
                description="Gerencie equipe e permissões"
                icon={UserCog}
              />
            }
          />
          <Route
            path="configuracoes"
            element={
              <PlaceholderPage
                title="Configurações"
                description="Configure seu estabelecimento"
                icon={Settings}
              />
            }
          />
          <Route
            path="suporte"
            element={
              <PlaceholderPage
                title="Suporte"
                description="Central de ajuda e contato"
                icon={HelpCircle}
              />
            }
          />
          <Route
            path="conta"
            element={
              <PlaceholderPage
                title="Minha conta"
                description="Gerencie seu perfil e preferências"
                icon={User}
              />
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
