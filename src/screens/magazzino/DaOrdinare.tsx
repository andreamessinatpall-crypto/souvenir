import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../lib/db'
import { whatsappUrl } from '../../lib/suppliers'
import { createOrder } from '../../lib/orders'
import type { Product, Supplier } from '../../lib/types'

interface DaOrdinareProps {
  onClose: () => void
}

interface Gruppo {
  fornitore: Supplier | null
  prodotti: { product: Product; quantita: number }[]
}

export function DaOrdinare({ onClose }: DaOrdinareProps) {
  const gruppi = useLiveQuery(async () => {
    const [products, suppliers, orders] = await Promise.all([
      db.products.toArray(),
      db.suppliers.toArray(),
      db.orders.where('stato').equals('in_attesa').toArray(),
    ])
    const bassi = products.filter((p) => p.quantita <= p.soglia_minima)
    const supplierMap = new Map(suppliers.map((s) => [s.id, s]))
    const alreadyOrdering = new Set(orders.map((o) => o.fornitore_id))

    const groups = new Map<string, Gruppo>()
    for (const product of bassi) {
      const key = product.fornitore_id ?? '__nessuno__'
      if (!groups.has(key)) {
        groups.set(key, { fornitore: product.fornitore_id ? supplierMap.get(product.fornitore_id) ?? null : null, prodotti: [] })
      }
      const suggerita = Math.max(product.soglia_minima * 2 - product.quantita, product.soglia_minima)
      groups.get(key)!.prodotti.push({ product, quantita: suggerita })
    }
    return { groups: Array.from(groups.values()), alreadyOrdering }
  }, [])

  const [sending, setSending] = useState<string | null>(null)

  async function handleOrdina(gruppo: Gruppo) {
    if (!gruppo.fornitore || sending) return
    setSending(gruppo.fornitore.id)
    try {
      await createOrder(gruppo.fornitore.id, gruppo.prodotti)
      if (gruppo.fornitore.telefono) {
        const elenco = gruppo.prodotti.map((p) => `${p.product.nome} x${p.quantita}`).join(', ')
        window.open(whatsappUrl(gruppo.fornitore.telefono, `Vorrei ordinare: ${elenco}. Grazie!`), '_blank')
      }
    } catch (err) {
      console.error('creazione ordine fallita', err)
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <button type="button" onClick={onClose} className="text-2xl leading-none text-slate-500">
          ✕
        </button>
        <h1 className="text-lg font-semibold text-slate-800">Da ordinare</h1>
        <div className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {gruppi?.groups.length === 0 && (
          <div className="mt-16 flex flex-col items-center gap-2 px-6 text-center">
            <span className="text-4xl">✅</span>
            <p className="max-w-xs text-slate-400">Tutto rifornito, nessun prodotto sotto scorta minima.</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {gruppi?.groups.map((gruppo, i) => {
            const key = gruppo.fornitore?.id ?? '__nessuno__'
            const giaOrdinato = gruppo.fornitore ? gruppi.alreadyOrdering.has(gruppo.fornitore.id) : false
            return (
              <div key={key + i} className="rounded-2xl border border-slate-200 p-4">
                <p className="mb-2 font-semibold text-slate-800">
                  {gruppo.fornitore?.nome ?? 'Senza fornitore'}
                </p>
                <ul className="mb-3 flex flex-col gap-1 text-sm text-slate-500">
                  {gruppo.prodotti.map(({ product, quantita }) => (
                    <li key={product.id}>
                      {product.nome} — <span className="font-medium text-orange-600">{product.quantita} in stock</span>, ordina {quantita}
                    </li>
                  ))}
                </ul>
                {gruppo.fornitore ? (
                  giaOrdinato ? (
                    <p className="text-sm font-medium text-green-600">✓ Ordine già in corso</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOrdina(gruppo)}
                      disabled={sending === gruppo.fornitore.id}
                      className={`w-full rounded-xl py-3 font-semibold disabled:opacity-40 ${
                        gruppo.fornitore.telefono
                          ? 'bg-green-600 text-white'
                          : 'border border-slate-300 text-slate-700'
                      }`}
                    >
                      {gruppo.fornitore.telefono ? '💬 Ordina su WhatsApp' : 'Segna come ordinato'}
                    </button>
                  )
                ) : (
                  <p className="text-sm text-slate-400">Assegna un fornitore a questi prodotti per poterli ordinare.</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
