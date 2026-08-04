import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { modalMotion } from '@/animations/motion'
import { formatPhoneInput, onlyDigits } from '@/utils/formatters'
import { isValidPhone } from '@/utils/validators'

interface PhonePromptModalProps {
  open: boolean
  title?: string
  description?: string
  onClose: () => void
  onConfirm: (phone: string) => void
}

export function PhonePromptModal({
  open,
  title = 'Informe seu telefone',
  description,
  onClose,
  onConfirm,
}: PhonePromptModalProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setValue('')
    setError(null)
    const id = setTimeout(() => inputRef.current?.focus(), 50)
    return () => clearTimeout(id)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!isValidPhone(value)) {
      setError('Informe um telefone válido.')
      return
    }
    onConfirm(onlyDigits(value))
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          {...modalMotion.overlay}
        >
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Fechar"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="phone-modal-title"
            className="relative z-10 w-full max-w-sm rounded-[var(--radius-lg)] bg-canvas p-5 shadow-[var(--shadow-lift)]"
            {...modalMotion.panel}
          >
            <div className="flex items-center justify-between">
              <h2 id="phone-modal-title" className="text-base font-semibold text-ink">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="grid h-8 w-8 place-items-center rounded-[var(--radius-md)] text-muted hover:bg-surface-2 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
            <form onSubmit={submit} className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-sm text-ink-soft">Telefone</span>
                <input
                  ref={inputRef}
                  required
                  inputMode="tel"
                  autoComplete="tel"
                  value={value}
                  onChange={(e) => {
                    setValue(formatPhoneInput(e.target.value))
                    setError(null)
                  }}
                  placeholder="(11) 91234-5678"
                  className="h-11 w-full rounded-[var(--radius-md)] border border-line px-3 text-sm outline-none focus:border-ink/30"
                />
              </label>
              {error ? <p className="text-sm text-danger">{error}</p> : null}
              <button
                type="submit"
                className="btn-primary flex h-11 w-full items-center justify-center rounded-[var(--radius-md)] text-sm font-semibold transition"
              >
                Continuar
              </button>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
