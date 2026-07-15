import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../lib/db'
import { registraAcquisti } from '../../lib/products'
import { GroupedProductInputList } from '../../components/GroupedProductInputList'
import { EntrySummaryBar } from '../../components/EntrySummaryBar'
import { EmptyState } from '../../components/EmptyState'

interface RegistraAcquistoProps {
  onClose: () => void
}

export function RegistraAcquisto({ onClose }: RegistraAcquistoProps) {
  const products = useLiveQuery(() => db.products.orderBy('nome').toArray(), [])
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [confirmedMessage, setConfirmedMessage] = useState(false)

  const hasEntries = Object.values(quantities).some((v) => (Number.parseInt(v, 10) || 0) > 0)

  function setQty(id: string, value: string) {
    setQuantities((prev) => ({ ...prev, [id]: value.replace(/\D/g, '') }))
  }

  async function handleSave() {
    if (!hasEntries || saving) return
    setSaving(true)
    try {
      const lines = Object.entries(quantities)
        .map(([productId, v]) => ({ productId, quantita: Number.parseInt(v, 10) || 0 }))
        .filter((l) => l.quantita > 0)
      if (lines.length > 0) {
        await registraAcquisti(lines)
        setQuantities({})
        setConfirmedMessage(true)
        setTimeout(() => setConfirmedMessage(false), 2000)
      }
    } catch (err) {
      console.error('registrazione acquisto fallita', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <button type="button" onClick={onClose} className="text-2xl leading-none text-slate-500">
          ✕
        </button>
        <h1 className="text-lg font-semibold text-slate-800">Registra acquisto</h1>
        <div className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="mb-4 text-sm text-slate-500">
          Scrivi quanti pezzi hai acquistato per ogni prodotto. Andranno nella scorta (scatoli); potrai spostarli
          in negozio quando vuoi dalla scheda del prodotto.
        </p>
        {products?.length === 0 ? (
          <EmptyState icon="📦" message="Nessun prodotto in magazzino. Aggiungine uno prima." />
        ) : (
          <GroupedProductInputList
            products={products ?? []}
            quantities={quantities}
            onQtyChange={setQty}
            contextLabel={(p) => `${p.quantita_scorta} in scorta`}
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
          {saving ? 'Salvataggio...' : 'Salva acquisto'}
        </button>
      </div>

      {confirmedMessage && (
        <div className="pointer-events-none fixed inset-x-0 top-6 z-30 flex justify-center">
          <div className="animate-toast-in rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-lg">
            ✓ Acquisto registrato
          </div>
        </div>
      )}
    </div>
  )
}
