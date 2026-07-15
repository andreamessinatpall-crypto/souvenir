const currencyFormatter = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
})

export function formatEUR(value: number): string {
  return currencyFormatter.format(value)
}

export function parseEuroInput(value: string): number {
  const normalized = value.replace(/\./g, '').replace(',', '.')
  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatEuroInput(value: number): string {
  return value.toString().replace('.', ',')
}

const dateFormatter = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatDate(ms: number): string {
  return dateFormatter.format(new Date(ms))
}

const longDateFormatter = new Intl.DateTimeFormat('it-IT', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export function formatDateLong(ms: number): string {
  const s = longDateFormatter.format(new Date(ms))
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function dayKey(ms: number): string {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function dayKeyToMs(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

export function todayKey(): string {
  return dayKey(Date.now())
}
