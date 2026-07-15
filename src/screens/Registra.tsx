import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { db } from '../lib/db'
import { createSale, type CartLine } from '../lib/sales'
import type { Product } from '../lib/types'
import { EmptyState } from '../components/EmptyState'
import { formatDateLong } from '../lib/format'
import { StoricoVendite } from './registra/StoricoVendite'

const SENZA_ETICHETTA = 'Senza etichetta'

export function Registra() {
  const products = useLiveQuery(() => db.products.orderBy('nome').toArray(), [])
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [confirmedMessage, setConfirmedMessage] = useState(false)
  const [showStorico, setShowStorico] = useState(false)

  const groups = useMemo(() => {
    if (!products) return []
    const map = new Map<string, Product[]>()
    for (const p of products) {
      const key = p.categoria?.trim() || SENZA_ETICHETTA
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [products])

  const hasEntries = Object.values(quantities).some((v) => (Number.parseInt(v, 10) || 0) > 0)

  function setQty(id: string, value: string) {
    setQuantities((prev) => ({ ...prev, [id]: value.replace(/\D/g, '') }))
  }

  async function handleSave() {
    if (!products || saving || !hasEntries) return
    setSaving(true)
    try {
      const lines = Object.entries(quantities)
        .map(([id, v]) => {
          const quantita = Number.parseInt(v, 10) || 0
          const product = products.find((p) => p.id === id)
          return product && quantita > 0 ? { product, quantita } : null
        })
        .filter((l): l is CartLine => l !== null)

      if (lines.length > 0) {
        await createSale(lines, 'contanti')
        setQuantities({})
        setConfirmedMessage(true)
        setTimeout(() => setConfirmedMessage(false), 2000)
      }
    } catch (err) {
      console.error('registrazione giornata fallita', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-4">
        <p className="text-sm font-medium text-slate-500">{formatDateLong(Date.now())}</p>
        <button
          type="button"
          onClick={() => setShowStorico(true)}
          className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600"
        >
          📅 Storico
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {products?.length === 0 && (
          <EmptyState icon="📦" message="Nessun prodotto in magazzino. Aggiungine uno dalla sezione Magazzino." />
        )}

        <div className="flex flex-col gap-6">
          {groups.map(([categoria, items]) => (
            <div key={categoria}>
              <h2 className="mb-2 text-sm font-semibold text-slate-500">{categoria}</h2>
              <ul className="flex flex-col gap-2">
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
                      <p className="text-xs text-slate-400">{product.quantita_negozio} in negozio</p>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={quantities[product.id] ?? ''}
                      onChange={(e) => setQty(product.id, e.target.value)}
                      placeholder="0"
                      className="w-16 shrink-0 rounded-xl border border-slate-300 px-3 py-2 text-center text-lg"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div
        className="border-t border-slate-200 px-4 py-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasEntries || saving}
          className="w-full rounded-2xl bg-[#0b4468] py-4 text-lg font-semibold text-white disabled:opacity-40"
        >
          {saving ? 'Salvataggio...' : 'Salva giornata'}
        </button>
      </div>

      {confirmedMessage && (
        <div className="pointer-events-none fixed inset-x-0 top-6 z-30 flex justify-center">
          <div className="animate-toast-in rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-lg">
            ✓ Giornata registrata
          </div>
        </div>
      )}

      {showStorico && <StoricoVendite onClose={() => setShowStorico(false)} />}
    </div>
  )
}
