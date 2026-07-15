import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import type { Product } from '../lib/types'

const SENZA_ETICHETTA = 'Senza etichetta'

export function Report() {
  const data = useLiveQuery(async () => {
    const [products, saleItems] = await Promise.all([db.products.toArray(), db.sale_items.toArray()])

    const totaleNegozio = products.reduce((sum, p) => sum + p.quantita_negozio, 0)
    const totaleScorta = products.reduce((sum, p) => sum + p.quantita_scorta, 0)
    const sottoSoglia = products.filter((p) => p.quantita_negozio + p.quantita_scorta <= p.soglia_minima).length

    const groups = new Map<string, Product[]>()
    for (const p of products) {
      const key = p.categoria?.trim() || SENZA_ETICHETTA
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(p)
    }
    const gruppi = Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))

    const venditePerProdotto = new Map<string, { nome: string; quantita: number }>()
    for (const item of saleItems) {
      const entry = venditePerProdotto.get(item.product_id) ?? { nome: item.nome_prodotto, quantita: 0 }
      entry.quantita += item.quantita
      venditePerProdotto.set(item.product_id, entry)
    }
    const topProdotti = Array.from(venditePerProdotto.values())
      .sort((a, b) => b.quantita - a.quantita)
      .slice(0, 5)

    return { totaleNegozio, totaleScorta, sottoSoglia, gruppi, topProdotti }
  }, [])

  if (!data) return null

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="In negozio" value={data.totaleNegozio} />
        <StatCard label="In scorta" value={data.totaleScorta} />
        <StatCard label="Sotto soglia" value={data.sottoSoglia} accent={data.sottoSoglia > 0} />
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {data.gruppi.map(([categoria, items]) => (
          <div key={categoria}>
            <h2 className="mb-2 text-sm font-semibold text-slate-500">{categoria}</h2>
            <ul className="flex flex-col gap-2">
              {items.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <span className="truncate font-medium text-slate-800">{product.nome}</span>
                  <span className="shrink-0 text-sm text-slate-500">
                    🏪 {product.quantita_negozio} · 📦 {product.quantita_scorta}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {data.topProdotti.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-500">Prodotti più venduti</h2>
          <ol className="flex flex-col gap-2">
            {data.topProdotti.map((p, i) => (
              <li
                key={p.nome + i}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                    {i + 1}
                  </span>
                  <span className="font-medium text-slate-800">{p.nome}</span>
                </span>
                <span className="font-semibold text-slate-600">{p.quantita} pz</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 ${accent ? 'border-orange-200 bg-orange-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? 'text-orange-700' : 'text-slate-800'}`}>{value}</p>
    </div>
  )
}
