import { Navigate, Route, Routes } from 'react-router-dom'
import { StoreLayout } from '@/layouts/StoreLayout'
import { HomePage } from '@/pages/Home'
import { MenuPage } from '@/pages/Menu'
import { CheckoutPage } from '@/pages/Checkout'
import { OrderTrackingPage } from '@/pages/OrderTracking'
import { OrderHistoryPage } from '@/pages/OrderHistory'
import { LoginPage } from '@/pages/Login'

const DEFAULT_SLUG =
  (import.meta.env.VITE_DEFAULT_SLUG as string | undefined) ?? 'burger-house'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to={`/${DEFAULT_SLUG}`} replace />} />
      <Route path="/:slug" element={<StoreLayout />}>
        <Route index element={<HomePage />} />
        <Route path="cardapio" element={<MenuPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="pedido/:code" element={<OrderTrackingPage />} />
        <Route path="pedidos" element={<OrderHistoryPage />} />
      </Route>
      <Route path="*" element={<Navigate to={`/${DEFAULT_SLUG}`} replace />} />
    </Routes>
  )
}
