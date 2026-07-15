import { useMemo, useState } from 'react'
import type { Product } from '../lib/types'

const SENZA_ETICHETTA = 'Senza etichetta'

interface GroupedProductInputListProps {
  products: Product[]
  quantities: Record<string, string>
  onQtyChange: (id: string, value: string) => void
  contextLabel: (p: Product) => string
}

export function GroupedProductInputList({
  products,
  quantities,
  onQtyChange,
  contextLabel,
}: GroupedProductInputListProps) {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase()
    const filtered = term
      ? products.filter(
          (p) => p.nome.toLowerCase().includes(term) || p.codice?.toLowerCase().includes(term),
        )
      : products
    const map = new Map<string, Product[]>()
    for (const p of filtered) {
      const key = p.categoria?.trim() || SENZA_ETICHETTA
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [products, search])

  function toggle(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function countEntered(items: Product[]) {
    return items.filter((p) => (Number.parseInt(quantities[p.id] ?? '0', 10) || 0) > 0).length
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="🔍 Cerca prodotto o codice..."
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg"
      />

      {groups.map(([categoria, items]) => {
        const isOpen = search.trim() !== '' || !!expanded[categoria]
        const enteredCount = countEntered(items)
        return (
          <div key={categoria}>
            <button
              type="button"
              onClick={() => toggle(categoria)}
              className="flex w-full items-center justify-between rounded-xl bg-slate-100 px-3 py-2"
            >
              <span className="text-sm font-semibold text-slate-600">
                {categoria} <span className="font-normal text-slate-400">({items.length})</span>
              </span>
              <span className="flex items-center gap-2">
                {enteredCount > 0 && (
                  <span className="rounded-full bg-[#0b4468] px-2 py-0.5 text-xs font-bold text-white">
                    {enteredCount}
                  </span>
                )}
                <span className="text-slate-400">{isOpen ? '▾' : '▸'}</span>
              </span>
            </button>
            {isOpen && (
              <ul className="mt-2 flex flex-col gap-2">
                {items.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-xl text-slate-300">
                      {product.foto ? (
                        <img src={product.foto} alt="" className="h-full w-full object-cover" />
                      ) : (
                        '🎁'
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-800">{product.nome}</p>
                      <p className="text-xs text-slate-400">{contextLabel(product)}</p>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={quantities[product.id] ?? ''}
                      onChange={(e) => onQtyChange(product.id, e.target.value)}
                      placeholder="0"
                      className="w-16 shrink-0 rounded-xl border border-slate-300 px-3 py-2 text-center text-lg"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}
