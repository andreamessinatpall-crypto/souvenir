import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../../lib/db'
import { dayKey, dayKeyToMs, formatDateLong } from '../../lib/format'

interface StoricoVenditeProps {
  onClose: () => void
}

interface Giorno {
  key: string
  data: number
  totaleArticoli: number
  prodotti: { nome: string; quantita: number }[]
}

export function StoricoVendite({ onClose }: StoricoVenditeProps) {
  const [filtro, setFiltro] = useState('')

  const giorni = useLiveQuery(async () => {
    const [sales, saleItems] = await Promise.all([db.sales.toArray(), db.sale_items.toArray()])
    const itemsBySale = new Map<string, typeof saleItems>()
    for (const item of saleItems) {
      const list = itemsBySale.get(item.sale_id) ?? []
      list.push(item)
      itemsBySale.set(item.sale_id, list)
    }

    const byDay = new Map<string, Giorno>()
    for (const sale of sales) {
      const key = dayKey(sale.data)
      const giorno = byDay.get(key) ?? { key, data: sale.data, totaleArticoli: 0, prodotti: [] }
      const items = itemsBySale.get(sale.id) ?? []
      for (const item of items) {
        giorno.totaleArticoli += item.quantita
        const prodotto = giorno.prodotti.find((p) => p.nome === item.nome_prodotto)
        if (prodotto) prodotto.quantita += item.quantita
        else giorno.prodotti.push({ nome: item.nome_prodotto, quantita: item.quantita })
      }
      byDay.set(key, giorno)
    }

    return Array.from(byDay.values()).sort((a, b) => b.data - a.data)
  }, [])

  const giorniFiltrati = filtro ? giorni?.filter((g) => g.key === filtro) : giorni

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <button type="button" onClick={onClose} className="text-2xl leading-none text-slate-500">
          ✕
        </button>
        <h1 className="text-lg font-semibold text-slate-800">Storico venduto</h1>
        <div className="w-8" />
      </header>

      <div className="border-b border-slate-200 px-4 py-3">
        <input
          type="date"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg"
        />
        {filtro && (
          <button type="button" onClick={() => setFiltro('')} className="mt-2 text-sm font-medium text-slate-500">
            ✕ Rimuovi filtro
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {giorniFiltrati?.length === 0 && (
          <p className="mt-12 text-center text-slate-400">
            {filtro ? 'Nessuna vendita in questa data.' : 'Nessuna giornata registrata ancora.'}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {giorniFiltrati?.map((giorno) => (
            <div key={giorno.key} className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-semibold text-slate-800">{formatDateLong(dayKeyToMs(giorno.key))}</p>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                  {giorno.totaleArticoli} pz
                </span>
              </div>
              <ul className="flex flex-col gap-1 text-sm text-slate-500">
                {giorno.prodotti.map((p) => (
                  <li key={p.nome}>
                    {p.nome} × {p.quantita}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
