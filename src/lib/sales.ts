import { db, enqueueSync, uuid } from './db'
import type { MetodoPagamento, Product } from './types'

export interface CartLine {
  product: Product
  quantita: number
}

export async function createSale(lines: CartLine[], metodo_pagamento: MetodoPagamento): Promise<string> {
  const saleId = uuid()
  const now = Date.now()
  const totale = lines.reduce((sum, line) => sum + line.product.prezzo * line.quantita, 0)

  const saleItemIds: string[] = []

  await db.transaction('rw', db.sales, db.sale_items, db.products, async () => {
    await db.sales.add({ id: saleId, data: now, totale, metodo_pagamento, created_at: now })

    for (const line of lines) {
      const saleItemId = uuid()
      saleItemIds.push(saleItemId)
      await db.sale_items.add({
        id: saleItemId,
        sale_id: saleId,
        product_id: line.product.id,
        nome_prodotto: line.product.nome,
        quantita: line.quantita,
        prezzo_unitario: line.product.prezzo,
      })

      const current = await db.products.get(line.product.id)
      if (current) {
        await db.products.update(line.product.id, {
          quantita: Math.max(0, current.quantita - line.quantita),
          updated_at: now,
        })
      }
    }
  })

  await enqueueSync('sales', saleId, 'insert')
  for (const id of saleItemIds) {
    await enqueueSync('sale_items', id, 'insert')
  }
  for (const line of lines) {
    await enqueueSync('products', line.product.id, 'update')
  }

  return saleId
}
