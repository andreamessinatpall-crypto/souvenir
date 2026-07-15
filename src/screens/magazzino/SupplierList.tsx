import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../lib/db'
import { createSupplier } from '../../lib/suppliers'
import type { Supplier } from '../../lib/types'
import { SupplierForm } from './SupplierForm'
import { SupplierDetail } from './SupplierDetail'
import { DaOrdinare } from './DaOrdinare'
import { EmptyState } from '../../components/EmptyState'

export function SupplierList() {
  const suppliers = useLiveQuery(() => db.suppliers.orderBy('nome').toArray(), [])
  const products = useLiveQuery(() => db.products.toArray(), [])
  const daOrdinareCount = products?.filter((p) => p.quantita_negozio + p.quantita_scorta <= p.soglia_minima).length ?? 0

  const [editing, setEditing] = useState<Supplier | 'new' | null>(null)
  const [viewing, setViewing] = useState<Supplier | null>(null)
  const [showDaOrdinare, setShowDaOrdinare] = useState(false)

  function countProdotti(fornitoreId: string) {
    return products?.filter((p) => p.fornitore_id === fornitoreId).length ?? 0
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 px-4 pt-4">
        <button
          type="button"
          onClick={() => setShowDaOrdinare(true)}
          className="flex items-center justify-between rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-left"
        >
          <span className="font-medium text-orange-700">📋 Da ordinare</span>
          {daOrdinareCount > 0 && (
            <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-sm font-bold text-white">
              {daOrdinareCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setEditing('new')}
          className="w-full rounded-2xl bg-[#0b4468] py-4 text-lg font-semibold text-white active:bg-[#093652]"
        >
          + Nuovo fornitore
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {suppliers?.length === 0 && (
          <EmptyState icon="🚚" message="Nessun fornitore ancora. Aggiungine uno con il pulsante qui sopra." />
        )}

        <ul className="flex flex-col gap-2">
          {suppliers?.map((supplier) => (
            <li key={supplier.id}>
              <button
                type="button"
                onClick={() => setViewing(supplier)}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{supplier.nome}</p>
                  {supplier.telefono && <p className="text-sm text-slate-500">{supplier.telefono}</p>}
                </div>
                <span className="shrink-0 text-sm text-slate-400">{countProdotti(supplier.id)} prodotti</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {editing && (
        <SupplierForm
          onClose={() => setEditing(null)}
          onSave={async (input) => {
            if (editing === 'new') await createSupplier(input)
          }}
        />
      )}

      {viewing && <SupplierDetail supplier={viewing} onClose={() => setViewing(null)} />}

      {showDaOrdinare && <DaOrdinare onClose={() => setShowDaOrdinare(false)} />}
    </div>
  )
}
