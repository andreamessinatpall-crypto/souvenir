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

export async function adjustProductQuantity(id: string, delta: number): Promise<void> {
  await db.transaction('rw', db.products, async () => {
    const product = await db.products.get(id)
    if (!product) return
    const quantita = Math.max(0, product.quantita + delta)
    await db.products.update(id, { quantita, updated_at: Date.now() })
  })
  await enqueueSync('products', id, 'update')
}
