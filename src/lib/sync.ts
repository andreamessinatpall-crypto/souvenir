import { db } from './db'
import { supabase } from './supabaseClient'
import type { SyncQueueItem, SyncTabella } from './types'

const NETWORK_TIMEOUT_MS = 8000

function withTimeout<T>(promise: PromiseLike<T>): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), NETWORK_TIMEOUT_MS)),
  ])
}

function toIso(ms: number): string {
  return new Date(ms).toISOString()
}

function toMs(iso: string): number {
  return new Date(iso).getTime()
}

const TABLE_HANDLERS: Record<
  SyncTabella,
  {
    dexieTable: 'products' | 'sales' | 'sale_items' | 'suppliers' | 'orders' | 'order_items'
    toRow: (r: any) => any
    fromRow: (r: any) => any
  }
> = {
  products: {
    dexieTable: 'products',
    toRow: (p) => ({
      id: p.id,
      codice: p.codice ?? null,
      nome: p.nome,
      categoria: p.categoria ?? null,
      prezzo: p.prezzo ?? null,
      quantita_negozio: p.quantita_negozio,
      quantita_scorta: p.quantita_scorta,
      soglia_minima: p.soglia_minima,
      foto: p.foto ?? null,
      fornitore_id: p.fornitore_id ?? null,
      costo_acquisto: p.costo_acquisto ?? null,
      created_at: toIso(p.created_at),
      updated_at: toIso(p.updated_at),
    }),
    fromRow: (p) => ({
      id: p.id,
      codice: p.codice ?? undefined,
      nome: p.nome,
      categoria: p.categoria ?? undefined,
      prezzo: p.prezzo ?? undefined,
      quantita_negozio: p.quantita_negozio,
      quantita_scorta: p.quantita_scorta,
      soglia_minima: p.soglia_minima,
      foto: p.foto ?? undefined,
      fornitore_id: p.fornitore_id ?? undefined,
      costo_acquisto: p.costo_acquisto ?? undefined,
      created_at: toMs(p.created_at),
      updated_at: toMs(p.updated_at),
    }),
  },
  sales: {
    dexieTable: 'sales',
    toRow: (s) => ({
      id: s.id,
      data: toIso(s.data),
      totale: s.totale,
      metodo_pagamento: s.metodo_pagamento,
      created_at: toIso(s.created_at),
    }),
    fromRow: (s) => ({
      id: s.id,
      data: toMs(s.data),
      totale: s.totale,
      metodo_pagamento: s.metodo_pagamento,
      created_at: toMs(s.created_at),
    }),
  },
  sale_items: {
    dexieTable: 'sale_items',
    toRow: (i) => ({
      id: i.id,
      sale_id: i.sale_id,
      product_id: i.product_id,
      nome_prodotto: i.nome_prodotto,
      quantita: i.quantita,
      prezzo_unitario: i.prezzo_unitario,
    }),
    fromRow: (i) => ({
      id: i.id,
      sale_id: i.sale_id,
      product_id: i.product_id ?? undefined,
      nome_prodotto: i.nome_prodotto,
      quantita: i.quantita,
      prezzo_unitario: i.prezzo_unitario,
    }),
  },
  suppliers: {
    dexieTable: 'suppliers',
    toRow: (s) => ({
      id: s.id,
      nome: s.nome,
      telefono: s.telefono ?? null,
      note: s.note ?? null,
      created_at: toIso(s.created_at),
      updated_at: toIso(s.updated_at),
    }),
    fromRow: (s) => ({
      id: s.id,
      nome: s.nome,
      telefono: s.telefono ?? undefined,
      note: s.note ?? undefined,
      created_at: toMs(s.created_at),
      updated_at: toMs(s.updated_at),
    }),
  },
  orders: {
    dexieTable: 'orders',
    toRow: (o) => ({
      id: o.id,
      fornitore_id: o.fornitore_id,
      data: toIso(o.data),
      stato: o.stato,
      totale_costo: o.totale_costo,
      created_at: toIso(o.created_at),
      updated_at: toIso(o.updated_at),
    }),
    fromRow: (o) => ({
      id: o.id,
      fornitore_id: o.fornitore_id,
      data: toMs(o.data),
      stato: o.stato,
      totale_costo: o.totale_costo,
      created_at: toMs(o.created_at),
      updated_at: toMs(o.updated_at),
    }),
  },
  order_items: {
    dexieTable: 'order_items',
    toRow: (i) => ({
      id: i.id,
      order_id: i.order_id,
      product_id: i.product_id,
      nome_prodotto: i.nome_prodotto,
      quantita: i.quantita,
      costo_unitario: i.costo_unitario,
    }),
    fromRow: (i) => ({
      id: i.id,
      order_id: i.order_id,
      product_id: i.product_id ?? undefined,
      nome_prodotto: i.nome_prodotto,
      quantita: i.quantita,
      costo_unitario: i.costo_unitario,
    }),
  },
}

const PULL_ORDER: SyncTabella[] = ['suppliers', 'products', 'sales', 'sale_items', 'orders', 'order_items']

export async function pullAllFromRemote(): Promise<void> {
  for (const tabella of PULL_ORDER) {
    const handler = TABLE_HANDLERS[tabella]
    const { data, error } = await withTimeout(supabase.from(tabella).select('*'))
    if (error) {
      console.error('pull error', tabella, error)
      continue
    }
    if (!data || data.length === 0) continue
    await (db[handler.dexieTable] as any).bulkPut(data.map(handler.fromRow))
  }
}

export async function pullIfLocalEmpty(): Promise<void> {
  const localCount = await db.products.count()
  if (localCount > 0) return
  try {
    await pullAllFromRemote()
  } catch (err) {
    console.error('pull iniziale fallito', err)
  }
}

async function processItem(item: SyncQueueItem): Promise<boolean> {
  const handler = TABLE_HANDLERS[item.tabella]

  try {
    if (item.operazione === 'delete') {
      const { error } = await withTimeout(supabase.from(item.tabella).delete().eq('id', item.record_id))
      if (error) {
        console.error('sync delete error', item.tabella, error)
        return false
      }
      return true
    }

    const record = await (db[handler.dexieTable] as any).get(item.record_id)
    if (!record) return true // record removed localmente nel frattempo, niente da sincronizzare

    const { error } = await withTimeout(supabase.from(item.tabella).upsert(handler.toRow(record)))
    if (error) console.error('sync upsert error', item.tabella, error)
    return !error
  } catch (err) {
    console.error('sync exception', item.tabella, err)
    return false
  }
}

let syncing = false

export async function processSyncQueue(): Promise<void> {
  if (syncing || !navigator.onLine) return
  syncing = true
  try {
    const items = await db.sync_queue.orderBy('timestamp').toArray()
    for (const item of items) {
      const ok = await processItem(item)
      if (ok) {
        await db.sync_queue.delete(item.id)
      } else {
        break // mantiene l'ordine: si ferma al primo errore e riprova al giro successivo
      }
    }
  } finally {
    syncing = false
  }
}

export function startSyncEngine(): () => void {
  processSyncQueue()

  const onOnline = () => processSyncQueue()
  const onQueueUpdated = () => processSyncQueue()
  window.addEventListener('online', onOnline)
  window.addEventListener('sync-queue-updated', onQueueUpdated)
  const interval = setInterval(processSyncQueue, 30000)

  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('sync-queue-updated', onQueueUpdated)
    clearInterval(interval)
  }
}
