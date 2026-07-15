import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../lib/db'
import { deleteSupplier, updateSupplier, whatsappUrl } from '../../lib/suppliers'
import { createProduct, deleteProduct, updateProduct } from '../../lib/products'
import { createOrder } from '../../lib/orders'
import { formatDate, formatEUR } from '../../lib/format'
import type { Order, OrderItem, Product, Supplier } from '../../lib/types'
import { ProductForm } from './ProductForm'
import { SupplierForm } from './SupplierForm'
import { ReceiveOrderSheet } from './ReceiveOrderSheet'

interface SupplierDetailProps {
  supplier: Supplier
  onClose: () => void
}

export function SupplierDetail({ supplier, onClose }: SupplierDetailProps) {
  const products = useLiveQuery(
    () => db.products.where('fornitore_id').equals(supplier.id).sortBy('nome'),
    [supplier.id],
  )
  const orders = useLiveQuery(
    () => db.orders.where('fornitore_id').equals(supplier.id).reverse().sortBy('data'),
    [supplier.id],
  )
  const lastOrder = orders?.[0]
  const olderOrders = orders?.slice(1) ?? []
  const orderItemsByOrder = useLiveQuery(async () => {
    if (!orders || orders.length === 0) return new Map<string, OrderItem[]>()
    const items = await db.order_items.where('order_id').anyOf(orders.map((o) => o.id)).toArray()
    const map = new Map<string, OrderItem[]>()
    for (const item of items) {
      const list = map.get(item.order_id) ?? []
      list.push(item)
      map.set(item.order_id, list)
    }
    return map
  }, [orders])
  const lastOrderItems = lastOrder ? orderItemsByOrder?.get(lastOrder.id) ?? [] : []

  const [editingProduct, setEditingProduct] = useState<Product | 'new' | null>(null)
  const [editingSupplier, setEditingSupplier] = useState(false)
  const [receivingOrder, setReceivingOrder] = useState(false)
  const [reordering, setReordering] = useState(false)

  async function handleReorder() {
    if (lastOrderItems.length === 0 || !products || reordering) return
    setReordering(true)
    try {
      const lines = lastOrderItems
        .map((item) => {
          const product = products.find((p) => p.id === item.product_id)
          return product ? { product, quantita: item.quantita } : null
        })
        .filter((l): l is { product: Product; quantita: number } => l !== null)
      if (lines.length > 0) await createOrder(supplier.id, lines)
    } catch (err) {
      console.error('reinvio ordine fallito', err)
    } finally {
      setReordering(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <button type="button" onClick={onClose} className="text-2xl leading-none text-slate-500">
          ✕
        </button>
        <h1 className="truncate text-lg font-semibold text-slate-800">{supplier.nome}</h1>
        <button type="button" onClick={() => setEditingSupplier(true)} className="text-xl leading-none text-slate-500">
          ✏️
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {supplier.telefono && (
          <div className="mb-4 flex gap-3">
            <a
              href={`tel:${supplier.telefono}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 font-medium text-slate-700"
            >
              📞 Chiama
            </a>
            <a
              href={whatsappUrl(supplier.telefono, 'Ciao, vorrei fare un ordine.')}
              target="_blank"
              rel="noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 py-3 font-medium text-green-700"
            >
              💬 WhatsApp
            </a>
          </div>
        )}

        {supplier.note && <p className="mb-4 whitespace-pre-wrap text-slate-600">{supplier.note}</p>}

        {lastOrder && (
          <div className="mb-6 rounded-2xl border border-slate-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold text-slate-800">Ultimo ordine</p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  lastOrder.stato === 'ricevuto' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}
              >
                {lastOrder.stato === 'ricevuto' ? 'Ricevuto' : 'In attesa'}
              </span>
            </div>
            <p className="mb-2 text-sm text-slate-500">
              Ordinato il {formatDate(lastOrder.data)}
              {lastOrder.stato === 'ricevuto' && ` — arrivato il ${formatDate(lastOrder.updated_at)}`}
            </p>
            <ul className="mb-3 flex flex-col gap-1 text-sm text-slate-500">
              {lastOrderItems?.map((item) => (
                <li key={item.id}>
                  {item.nome_prodotto} × {item.quantita}
                </li>
              ))}
            </ul>
            {lastOrder.stato === 'in_attesa' ? (
              <button
                type="button"
                onClick={() => setReceivingOrder(true)}
                className="w-full rounded-xl bg-[#0b4468] py-3 font-semibold text-white"
              >
                Segna ricevuto
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReorder}
                disabled={reordering}
                className="w-full rounded-xl border border-slate-300 py-3 font-semibold text-slate-700 disabled:opacity-40"
              >
                {reordering ? 'Invio...' : 'Ordina di nuovo'}
              </button>
            )}
          </div>
        )}

        {olderOrders.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-slate-500">Storico ordini</h2>
            <ul className="flex flex-col gap-2">
              {olderOrders.map((order) => (
                <OrderHistoryRow key={order.id} order={order} items={orderItemsByOrder?.get(order.id) ?? []} />
              ))}
            </ul>
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-500">Prodotti forniti</h2>
        </div>
        <button
          type="button"
          onClick={() => setEditingProduct('new')}
          className="mb-3 w-full rounded-2xl border-2 border-dashed border-slate-300 py-3 font-medium text-slate-500"
        >
          + Aggiungi prodotto a questo fornitore
        </button>
        <ul className="flex flex-col gap-2">
          {products?.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => setEditingProduct(product)}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-xl text-slate-300">
                  {product.foto ? <img src={product.foto} alt="" className="h-full w-full object-cover" /> : '🎁'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{product.nome}</p>
                  <p className="text-sm text-slate-500">{formatEUR(product.prezzo)}</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                  {product.quantita_negozio + product.quantita_scorta}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {editingProduct && (
        <ProductForm
          product={editingProduct === 'new' ? undefined : editingProduct}
          defaultFornitoreId={supplier.id}
          onClose={() => setEditingProduct(null)}
          onSave={async (input) => {
            if (editingProduct === 'new') await createProduct(input)
            else await updateProduct(editingProduct.id, input)
          }}
          onDelete={
            editingProduct !== 'new' ? async () => { await deleteProduct(editingProduct.id) } : undefined
          }
        />
      )}

      {editingSupplier && (
        <SupplierForm
          supplier={supplier}
          onClose={() => setEditingSupplier(false)}
          onSave={async (input) => {
            await updateSupplier(supplier.id, input)
          }}
          onDelete={async () => {
            await deleteSupplier(supplier.id)
            onClose()
          }}
        />
      )}

      {receivingOrder && lastOrder && (
        <ReceiveOrderSheet order={lastOrder} onClose={() => setReceivingOrder(false)} />
      )}
    </div>
  )
}

function OrderHistoryRow({ order, items }: { order: Order; items: OrderItem[] }) {
  return (
    <li className="rounded-xl border border-slate-200 px-3 py-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm text-slate-600">
          {formatDate(order.data)}
          {order.stato === 'ricevuto' && (
            <span className="text-slate-400"> → arrivato il {formatDate(order.updated_at)}</span>
          )}
        </span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
            order.stato === 'ricevuto' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
          }`}
        >
          {order.stato === 'ricevuto' ? 'Ricevuto' : 'In attesa'}
        </span>
      </div>
      <ul className="flex flex-col text-sm text-slate-500">
        {items.map((item) => (
          <li key={item.id}>
            {item.nome_prodotto} × {item.quantita}
          </li>
        ))}
      </ul>
    </li>
  )
}
