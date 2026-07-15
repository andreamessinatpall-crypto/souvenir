import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { db } from '../lib/db'
import { formatEUR } from '../lib/format'
import type { CartLine } from '../lib/sales'
import { CartSummary } from './vendi/CartSummary'
import { EmptyState } from '../components/EmptyState'

export function Vendi() {
  const products = useLiveQuery(() => db.products.orderBy('nome').toArray(), [])
  const [cart, setCart] = useState<Record<string, number>>({})
  const [showSummary, setShowSummary] = useState(false)
  const [confirmedMessage, setConfirmedMessage] = useState(false)

  const lines: CartLine[] = useMemo(() => {
    if (!products) return []
    return Object.entries(cart)
      .map(([productId, quantita]) => {
        const product = products.find((p) => p.id === productId)
        return product && quantita > 0 ? { product, quantita } : null
      })
      .filter((l): l is CartLine => l !== null)
  }, [cart, products])

  const totale = lines.reduce((sum, l) => sum + l.product.prezzo * l.quantita, 0)
  const itemCount = lines.reduce((sum, l) => sum + l.quantita, 0)

  function addToCart(productId: string) {
    setCart((prev) => ({ ...prev, [productId]: (prev[productId] ?? 0) + 1 }))
  }

  function setQuantity(productId: string, quantita: number) {
    setCart((prev) => {
      const next = { ...prev }
      if (quantita <= 0) delete next[productId]
      else next[productId] = quantita
      return next
    })
  }

  function handleConfirmed() {
    setCart({})
    setShowSummary(false)
    setConfirmedMessage(true)
    setTimeout(() => setConfirmedMessage(false), 2000)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-3">
        {products?.length === 0 && (
          <EmptyState icon="🛍️" message="Nessun prodotto in magazzino. Aggiungine uno dalla sezione Magazzino." />
        )}

        <div className="grid grid-cols-2 gap-3">
          {products?.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => addToCart(product.id)}
              disabled={product.quantita <= 0}
              className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left active:bg-slate-50 disabled:opacity-40"
            >
              <div className="flex aspect-square items-center justify-center bg-slate-100 text-4xl text-slate-300">
                {product.foto ? (
                  <img src={product.foto} alt="" className="h-full w-full object-cover" />
                ) : (
                  '🎁'
                )}
              </div>
              <div className="p-2">
                <p className="truncate text-sm font-medium text-slate-800">{product.nome}</p>
                <p className="text-sm font-semibold text-[#0b4468]">{formatEUR(product.prezzo)}</p>
              </div>
              {cart[product.id] > 0 && (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#0b4468] text-xs font-bold text-white">
                  {cart[product.id]}
                </span>
              )}
              {product.quantita <= 0 && (
                <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-semibold text-slate-500">
                  Esaurito
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {itemCount > 0 && (
        <button
          type="button"
          onClick={() => setShowSummary(true)}
          className="mx-3 mb-3 flex items-center justify-between rounded-2xl bg-[#0b4468] px-5 py-4 text-white active:bg-[#093652]"
          style={{ marginBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
        >
          <span className="font-medium">{itemCount} {itemCount === 1 ? 'articolo' : 'articoli'}</span>
          <span className="text-lg font-bold">{formatEUR(totale)}</span>
        </button>
      )}

      {showSummary && (
        <CartSummary
          lines={lines}
          onChangeQuantity={setQuantity}
          onClose={() => setShowSummary(false)}
          onConfirmed={handleConfirmed}
        />
      )}

      {confirmedMessage && (
        <div className="pointer-events-none fixed inset-x-0 top-6 z-30 flex justify-center">
          <div className="animate-toast-in rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-lg">
            ✓ Vendita registrata
          </div>
        </div>
      )}
    </div>
  )
}
