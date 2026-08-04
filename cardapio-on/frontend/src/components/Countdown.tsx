import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

function formatRemaining(diffMs: number): string {
  const totalSeconds = Math.floor(diffMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m ${seconds}s`
}

export function Countdown({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const end = new Date(endsAt).getTime()
  const diff = end - now
  if (Number.isNaN(end) || diff <= 0) return null

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
      style={{ background: 'var(--color-danger)' }}
    >
      <Clock className="h-3 w-3" />
      {formatRemaining(diff)}
    </span>
  )
}
