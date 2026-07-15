import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../lib/db'
import { createSale, type CartLine } from '../lib/sales'
import { EmptyState } from '../components/EmptyState'
import { GroupedProductInputList } from '../components/GroupedProductInputList'
import { EntrySummaryBar } from '../components/EntrySummaryBar'
import { addDaysToKey, dayKey, dayKeyToMs, formatDateLong, todayKey } from '../lib/format'

export function Registra() {
  const products = useLiveQuery(() => db.products.orderBy('nome').toArray(), [])
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [confirmedMessage, setConfirmedMessage] = useState(false)
  const [selectedDay, setSelectedDay] = useState(todayKey())

  const isOggi = selectedDay === todayKey()

  const riepilogoGiorno = useLiveQuery(async () => {
    if (isOggi) return null
    const [sales, saleItems] = await Promise.all([db.sales.toArray(), db.sale_items.toArray()])
    const saleIdsDelGiorno = new Set(sales.filter((s) => dayKey(s.data) === selectedDay).map((s) => s.id))
    const prodotti = new Map<string, number>()
    for (const item of saleItems) {
      if (!saleIdsDelGiorno.has(item.sale_id)) continue
      prodotti.set(item.nome_prodotto, (prodotti.get(item.nome_prodotto) ?? 0) + item.quantita)
    }
    return Array.from(prodotti.entries()).map(([nome, quantita]) => ({ nome, quantita }))
  }, [selectedDay, isOggi])

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
        <button
          type="button"
          onClick={() => setSelectedDay((d) => addDaysToKey(d, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600"
          aria-label="Giorno precedente"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => !isOggi && setSelectedDay(todayKey())}
          className="text-center text-sm font-medium text-slate-500"
        >
          {isOggi ? 'Oggi' : formatDateLong(dayKeyToMs(selectedDay))}
          {!isOggi && <span className="block text-xs text-[#0b4468]">↺ Torna a oggi</span>}
        </button>
        <button
          type="button"
          onClick={() => setSelectedDay((d) => addDaysToKey(d, 1))}
          disabled={isOggi}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-600 disabled:opacity-30"
          aria-label="Giorno successivo"
        >
          →
        </button>
      </div>

      {isOggi ? (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {products?.length === 0 ? (
              <EmptyState icon="📦" message="Nessun prodotto in magazzino. Aggiungine uno dalla sezione Magazzino." />
            ) : (
              <GroupedProductInputList
                products={products ?? []}
                quantities={quantities}
                onQtyChange={setQty}
                contextLabel={(p) => `${p.quantita_negozio} in negozio`}
              />
            )}
          </div>

          <EntrySummaryBar quantities={quantities} />

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
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {riepilogoGiorno?.length === 0 && (
            <p className="mt-12 text-center text-slate-400">Nessuna vendita registrata in questa data.</p>
          )}
          {riepilogoGiorno && riepilogoGiorno.length > 0 && (
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="mb-2 font-semibold text-slate-800">Venduto</p>
              <ul className="flex flex-col gap-1 text-sm text-slate-600">
                {riepilogoGiorno.map((p) => (
                  <li key={p.nome}>
                    {p.nome} × {p.quantita}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {confirmedMessage && (
        <div className="pointer-events-none fixed inset-x-0 top-6 z-30 flex justify-center">
          <div className="animate-toast-in rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-lg">
            ✓ Giornata registrata
          </div>
        </div>
      )}
    </div>
  )
}
