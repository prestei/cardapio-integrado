import type { BusinessHours } from '@/types'

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayDateKey(): string {
  return toDateKey(new Date())
}

export function maxScheduleDateKey(daysAhead: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysAhead)
  return toDateKey(date)
}

/**
 * Gera os horários disponíveis (HH:mm) para uma data, respeitando o
 * funcionamento do estabelecimento, intervalos de pausa e antecedência mínima.
 */
export function getAvailableSlots(
  businessHours: BusinessHours[],
  dateKey: string,
  slotMinutes: number,
  minLeadMinutes: number,
): string[] {
  if (!dateKey) return []
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y!, (m ?? 1) - 1, d ?? 1)
  const dayOfWeek = date.getDay()
  const hours = businessHours.find((h) => h.dayOfWeek === dayOfWeek)
  if (!hours || hours.isClosed || !hours.openTime || !hours.closeTime) return []

  let open = toMinutes(hours.openTime)
  let close = toMinutes(hours.closeTime)
  if (close <= open) close += 24 * 60
  const breakStart = hours.breakStart ? toMinutes(hours.breakStart) : null
  const breakEnd = hours.breakEnd ? toMinutes(hours.breakEnd) : null

  const isToday = dateKey === todayDateKey()
  const now = new Date()
  const minMinutesToday = isToday ? now.getHours() * 60 + now.getMinutes() + minLeadMinutes : -1

  const slots: string[] = []
  for (let minute = open; minute < close; minute += slotMinutes) {
    if (breakStart != null && breakEnd != null && minute >= breakStart && minute < breakEnd) continue
    if (isToday && minute < minMinutesToday) continue
    const hh = String(Math.floor(minute / 60) % 24).padStart(2, '0')
    const mm = String(minute % 60).padStart(2, '0')
    slots.push(`${hh}:${mm}`)
  }
  return slots
}

/**
 * Combina data (`YYYY-MM-DD`) e hora (`HH:mm`) locais em um ISO string.
 */
export function combineDateTimeToIso(dateKey: string, time: string): string | null {
  if (!dateKey || !time) return null
  const [y, m, d] = dateKey.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  if (y == null || m == null || d == null || hh == null || mm == null) return null
  const date = new Date(y, m - 1, d, hh, mm, 0, 0)
  return date.toISOString()
}
