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

const dateFormatter = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatDate(ms: number): string {
  return dateFormatter.format(new Date(ms))
}
