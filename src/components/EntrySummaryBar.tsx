interface EntrySummaryBarProps {
  quantities: Record<string, string>
}

export function EntrySummaryBar({ quantities }: EntrySummaryBarProps) {
  const entries = Object.values(quantities)
    .map((v) => Number.parseInt(v, 10) || 0)
    .filter((n) => n > 0)

  if (entries.length === 0) return null

  const totalePezzi = entries.reduce((sum, n) => sum + n, 0)

  return (
    <p className="px-4 py-2 text-center text-sm font-medium text-slate-500">
      {entries.length} {entries.length === 1 ? 'prodotto' : 'prodotti'} · {totalePezzi} pz totali
    </p>
  )
}
