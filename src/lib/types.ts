export interface Product {
  id: string
  nome: string
  categoria?: string
  prezzo: number
  quantita: number
  soglia_minima: number
  foto?: string
  fornitore_id?: string
  costo_acquisto?: number
  created_at: number
  updated_at: number
}

export type MetodoPagamento = 'contanti' | 'carta'

export interface Sale {
  id: string
  data: number
  totale: number
  metodo_pagamento: MetodoPagamento
  created_at: number
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  nome_prodotto: string
  quantita: number
  prezzo_unitario: number
}

export interface Supplier {
  id: string
  nome: string
  telefono?: string
  note?: string
  created_at: number
  updated_at: number
}

export type StatoOrdine = 'in_attesa' | 'ricevuto'

export interface Order {
  id: string
  fornitore_id: string
  data: number
  stato: StatoOrdine
  totale_costo: number
  created_at: number
  updated_at: number
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  nome_prodotto: string
  quantita: number
  costo_unitario: number
}

export type SyncOperazione = 'insert' | 'update' | 'delete'
export type SyncStato = 'pending' | 'synced' | 'error'
export type SyncTabella = 'products' | 'sales' | 'sale_items' | 'suppliers' | 'orders' | 'order_items'

export interface SyncQueueItem {
  id: string
  tabella: SyncTabella
  record_id: string
  operazione: SyncOperazione
  stato: SyncStato
  timestamp: number
}
