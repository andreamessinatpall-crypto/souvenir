import { db, enqueueSync, uuid } from './db'
import type { Product } from './types'

export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at'>

export async function createProduct(input: ProductInput): Promise<string> {
  const id = uuid()
  const now = Date.now()
  await db.products.add({ ...input, id, created_at: now, updated_at: now })
  await enqueueSync('products', id, 'insert')
  return id
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  await db.products.update(id, { ...input, updated_at: Date.now() })
  await enqueueSync('products', id, 'update')
}

export async function deleteProduct(id: string): Promise<void> {
  await db.products.delete(id)
  await enqueueSync('products', id, 'delete')
}

export async function transferToStore(id: string, quantita: number): Promise<void> {
  if (quantita <= 0) return
  await db.transaction('rw', db.products, async () => {
    const product = await db.products.get(id)
    if (!product) return
    const daSpostare = Math.min(quantita, product.quantita_scorta)
    await db.products.update(id, {
      quantita_negozio: product.quantita_negozio + daSpostare,
      quantita_scorta: product.quantita_scorta - daSpostare,
      updated_at: Date.now(),
    })
  })
  await enqueueSync('products', id, 'update')
}
