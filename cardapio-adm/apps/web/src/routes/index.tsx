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
import { AdditionalsPage } from '@/pages/AdditionalsPage'
import { KitchenPage } from '@/pages/KitchenPage'
import { CashPage } from '@/pages/CashPage'
import { MarketingPage } from '@/pages/MarketingPage'
import { CouponsPage } from '@/pages/CouponsPage'
import { CustomersPage } from '@/pages/CustomersPage'
import { DeliveriesPage } from '@/pages/DeliveriesPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { EmployeesPage } from '@/pages/EmployeesPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { QrCodesPage } from '@/pages/QrCodesPage'
import { SupportPage } from '@/pages/SupportPage'
import { AccountPage } from '@/pages/AccountPage'

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
          <Route path="adicionais" element={<AdditionalsPage />} />
          <Route path="cozinha" element={<KitchenPage />} />
          <Route path="caixa" element={<CashPage />} />
          <Route path="marketing" element={<MarketingPage />} />
          <Route path="cupons" element={<CouponsPage />} />
          <Route path="clientes" element={<CustomersPage />} />
          <Route path="entregas" element={<DeliveriesPage />} />
          <Route path="qr-codes" element={<QrCodesPage />} />
          <Route path="relatorios" element={<ReportsPage />} />
          <Route path="funcionarios" element={<EmployeesPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
          <Route path="suporte" element={<SupportPage />} />
          <Route path="conta" element={<AccountPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
