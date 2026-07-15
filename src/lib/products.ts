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

function prefixFrom(s: string, len: number): string {
  const clean = s.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return clean.slice(0, len) || 'GEN'
}

export function generateCodice(tipologia: string, nome: string, existingCodici: Iterable<string>): string {
  const base = `${prefixFrom(tipologia, 3)}-${prefixFrom(nome, 3)}`
  const used = new Set(existingCodici)
  let n = 1
  let codice = `${base}-${String(n).padStart(3, '0')}`
  while (used.has(codice)) {
    n += 1
    codice = `${base}-${String(n).padStart(3, '0')}`
  }
  return codice
}

export async function backfillMissingCodici(): Promise<void> {
  const products = await db.products.toArray()
  const existing = new Set(products.map((p) => p.codice).filter((c): c is string => !!c))
  for (const p of products) {
    if (p.codice) continue
    const codice = generateCodice(p.categoria || 'Generale', p.nome, existing)
    existing.add(codice)
    await db.products.update(p.id, { codice })
    await enqueueSync('products', p.id, 'update')
  }
}
