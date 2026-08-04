import { motion } from 'motion/react'
import { Header } from '@/components/Header'
import { CheckoutForm } from '@/components/Checkout'
import { pageTransition } from '@/animations/motion'

export function CheckoutPage() {
  return (
    <div className="min-h-dvh bg-canvas">
      <Header solid />
      <motion.main
        id="main-content"
        className="mx-auto max-w-6xl px-4 py-8 sm:px-6"
        {...pageTransition}
      >
        <h1 className="font-display text-3xl text-ink">Finalizar pedido</h1>
        <p className="mt-2 text-sm text-muted">
          Confira os dados e confirme. Você poderá acompanhar o status em seguida.
        </p>
        <div className="mt-8">
          <CheckoutForm />
        </div>
      </motion.main>
    </div>
  )
}
