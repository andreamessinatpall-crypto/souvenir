import Dexie, { type EntityTable } from 'dexie'
import type { Product, Sale, SaleItem, Supplier, Order, OrderItem, SyncQueueItem } from './types'

const db = new Dexie('souvenir-cefalu') as Dexie & {
  products: EntityTable<Product, 'id'>
  sales: EntityTable<Sale, 'id'>
  sale_items: EntityTable<SaleItem, 'id'>
  suppliers: EntityTable<Supplier, 'id'>
  orders: EntityTable<Order, 'id'>
  order_items: EntityTable<OrderItem, 'id'>
  sync_queue: EntityTable<SyncQueueItem, 'id'>
}

db.version(1).stores({
  products: 'id, nome, categoria, fornitore_id, quantita',
  sales: 'id, data',
  sale_items: 'id, sale_id, product_id',
  suppliers: 'id, nome',
  orders: 'id, fornitore_id, stato, data',
  order_items: 'id, order_id, product_id',
  sync_queue: 'id, tabella, stato, timestamp',
})

export { db }

export function uuid(): string {
  return crypto.randomUUID()
}

export async function enqueueSync(
  tabella: SyncQueueItem['tabella'],
  record_id: string,
  operazione: SyncQueueItem['operazione'],
) {
  await db.sync_queue.add({
    id: uuid(),
    tabella,
    record_id,
    operazione,
    stato: 'pending',
    timestamp: Date.now(),
  })
  window.dispatchEvent(new Event('sync-queue-updated'))
}
