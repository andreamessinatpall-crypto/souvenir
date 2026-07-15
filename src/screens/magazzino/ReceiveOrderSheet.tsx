import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../lib/db'
import { markOrderReceived } from '../../lib/orders'
import { Stepper } from '../../components/Stepper'
import type { Order } from '../../lib/types'

interface ReceiveOrderSheetProps {
  order: Order
  onClose: () => void
}

export function ReceiveOrderSheet({ order, onClose }: ReceiveOrderSheetProps) {
  const items = useLiveQuery(() => db.order_items.where('order_id').equals(order.id).toArray(), [order.id])
  const [quantities, setQuantities] = useState<Record<string, number> | null>(null)
  const [saving, setSaving] = useState(false)

  const effectiveQuantities = quantities ?? Object.fromEntries((items ?? []).map((i) => [i.id, i.quantita]))

  async function handleConfirm() {
    if (!items || saving) return
    setSaving(true)
    try {
      await markOrderReceived(
        order.id,
        items.map((i) => ({
          order_item_id: i.id,
          product_id: i.product_id ?? '',
          quantita: effectiveQuantities[i.id] ?? i.quantita,
        })),
      )
      onClose()
    } catch (err) {
      console.error('conferma ricezione fallita', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <button type="button" onClick={onClose} className="text-2xl leading-none text-slate-500">
          ✕
        </button>
        <h1 className="text-lg font-semibold text-slate-800">Conferma ricezione</h1>
        <div className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="mb-4 text-sm text-slate-500">
          Conferma le quantità arrivate. Il magazzino si aggiorna in automatico.
        </p>
        <ul className="flex flex-col gap-4">
          {items?.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3">
              <span className="font-medium text-slate-800">{item.nome_prodotto}</span>
              <Stepper
                value={effectiveQuantities[item.id] ?? item.quantita}
                onChange={(v) => setQuantities({ ...effectiveQuantities, [item.id]: v })}
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-slate-200 px-4 py-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={saving || !items}
          className="w-full rounded-2xl bg-[#0b4468] py-4 text-lg font-semibold text-white disabled:opacity-40"
        >
          {saving ? 'Salvataggio...' : 'Segna ricevuto'}
        </button>
      </div>
    </div>
  )
}
