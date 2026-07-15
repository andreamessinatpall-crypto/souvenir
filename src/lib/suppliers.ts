import { db, enqueueSync, uuid } from './db'
import type { Supplier } from './types'

export type SupplierInput = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>

export async function createSupplier(input: SupplierInput): Promise<string> {
  const id = uuid()
  const now = Date.now()
  await db.suppliers.add({ ...input, id, created_at: now, updated_at: now })
  await enqueueSync('suppliers', id, 'insert')
  return id
}

export async function updateSupplier(id: string, input: SupplierInput): Promise<void> {
  await db.suppliers.update(id, { ...input, updated_at: Date.now() })
  await enqueueSync('suppliers', id, 'update')
}

export async function deleteSupplier(id: string): Promise<void> {
  await db.suppliers.delete(id)
  await enqueueSync('suppliers', id, 'delete')
}

export function whatsappUrl(telefono: string, message: string): string {
  const digits = telefono.replace(/\D/g, '')
  const withCountryCode = digits.length <= 10 ? `39${digits}` : digits
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`
}
