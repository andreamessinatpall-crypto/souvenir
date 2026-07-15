import { db, enqueueSync, uuid } from './db'
import type { Product } from './types'

export interface OrderLine {
  product: Product
  quantita: number
}

export async function createOrder(fornitoreId: string, lines: OrderLine[]): Promise<string> {
  const orderId = uuid()
  const now = Date.now()
  const totale_costo = lines.reduce((sum, l) => sum + (l.product.costo_acquisto ?? 0) * l.quantita, 0)

  const orderItemIds: string[] = []

  await db.transaction('rw', db.orders, db.order_items, async () => {
    await db.orders.add({
      id: orderId,
      fornitore_id: fornitoreId,
      data: now,
      stato: 'in_attesa',
      totale_costo,
      created_at: now,
      updated_at: now,
    })

    for (const line of lines) {
      const itemId = uuid()
      orderItemIds.push(itemId)
      await db.order_items.add({
        id: itemId,
        order_id: orderId,
        product_id: line.product.id,
        nome_prodotto: line.product.nome,
        quantita: line.quantita,
        costo_unitario: line.product.costo_acquisto ?? 0,
      })
    }
  })

  await enqueueSync('orders', orderId, 'insert')
  for (const id of orderItemIds) {
    await enqueueSync('order_items', id, 'insert')
  }

  return orderId
}

export interface ReceivedLine {
  order_item_id: string
  product_id: string
  quantita: number
}

export async function markOrderReceived(orderId: string, receivedLines: ReceivedLine[]): Promise<void> {
  const now = Date.now()

  await db.transaction('rw', db.orders, db.products, async () => {
    await db.orders.update(orderId, { stato: 'ricevuto', updated_at: now })

    for (const line of receivedLines) {
      const product = await db.products.get(line.product_id)
      if (product) {
        await db.products.update(line.product_id, {
          quantita_scorta: product.quantita_scorta + line.quantita,
          updated_at: now,
        })
      }
    }
  })

  await enqueueSync('orders', orderId, 'update')
  for (const line of receivedLines) {
    await enqueueSync('products', line.product_id, 'update')
  }
}
