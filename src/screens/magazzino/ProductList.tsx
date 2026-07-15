import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../lib/db'
import { createProduct, deleteProduct, updateProduct } from '../../lib/products'
import { formatEUR } from '../../lib/format'
import type { Product } from '../../lib/types'
import { ProductForm } from './ProductForm'
import { EmptyState } from '../../components/EmptyState'

export function ProductList() {
  const products = useLiveQuery(() => db.products.orderBy('nome').toArray(), [])
  const [editing, setEditing] = useState<Product | 'new' | null>(null)

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-4">
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="w-full rounded-2xl bg-[#0b4468] py-4 text-lg font-semibold text-white active:bg-[#093652]"
        >
          + Nuovo prodotto
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {products?.length === 0 && (
          <EmptyState icon="📦" message="Nessun prodotto ancora. Aggiungi il primo con il pulsante qui sopra." />
        )}

        <ul className="flex flex-col gap-2">
          {products?.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => setEditing(product)}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left active:bg-slate-50"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-2xl text-slate-300">
                  {product.foto ? (
                    <img src={product.foto} alt="" className="h-full w-full object-cover" />
                  ) : (
                    '🎁'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{product.nome}</p>
                  <p className="truncate text-sm text-slate-500">
                    {product.codice && <span className="text-slate-400">{product.codice} · </span>}
                    {formatEUR(product.costo_acquisto ?? 0)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${
                      product.quantita_negozio + product.quantita_scorta <= product.soglia_minima
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {product.quantita_negozio + product.quantita_scorta}
                  </span>
                  <span className="text-xs text-slate-400">
                    🏪 {product.quantita_negozio} · 📦 {product.quantita_scorta}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {editing && (
        <ProductForm
          product={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSave={async (input) => {
            if (editing === 'new') {
              await createProduct(input)
            } else {
              await updateProduct(editing.id, input)
            }
          }}
          onDelete={
            editing !== 'new'
              ? async () => {
                  await deleteProduct(editing.id)
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
