import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { formatEUR } from '../lib/format'
import { startOfMonth, startOfToday, startOfWeek } from '../lib/dates'

export function Report() {
  const data = useLiveQuery(async () => {
    const [sales, saleItems, products] = await Promise.all([
      db.sales.toArray(),
      db.sale_items.toArray(),
      db.products.toArray(),
    ])

    const oggi = startOfToday()
    const settimana = startOfWeek()
    const mese = startOfMonth()

    const sumFrom = (from: number) =>
      sales.filter((s) => s.data >= from).reduce((sum, s) => sum + s.totale, 0)

    const incassoOggi = sumFrom(oggi)
    const incassoSettimana = sumFrom(settimana)
    const incassoMese = sumFrom(mese)

    const costMap = new Map(products.map((p) => [p.id, p.costo_acquisto]))
    const hasCosti = products.some((p) => typeof p.costo_acquisto === 'number')

    let guadagnoMese: number | null = null
    if (hasCosti) {
      const saleIdsInMonth = new Set(sales.filter((s) => s.data >= mese).map((s) => s.id))
      const costoVenduto = saleItems
        .filter((item) => saleIdsInMonth.has(item.sale_id))
        .reduce((sum, item) => sum + (costMap.get(item.product_id) ?? 0) * item.quantita, 0)
      guadagnoMese = incassoMese - costoVenduto
    }

    const venditePerProdotto = new Map<string, { nome: string; quantita: number }>()
    for (const item of saleItems) {
      const entry = venditePerProdotto.get(item.product_id) ?? { nome: item.nome_prodotto, quantita: 0 }
      entry.quantita += item.quantita
      venditePerProdotto.set(item.product_id, entry)
    }
    const topProdotti = Array.from(venditePerProdotto.values())
      .sort((a, b) => b.quantita - a.quantita)
      .slice(0, 5)

    return { incassoOggi, incassoSettimana, incassoMese, guadagnoMese, topProdotti }
  }, [])

  if (!data) return null

  return (
    <div className="h-full overflow-y-auto px-4 py-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Oggi" value={formatEUR(data.incassoOggi)} />
        <StatCard label="Questa settimana" value={formatEUR(data.incassoSettimana)} />
        <StatCard label="Questo mese" value={formatEUR(data.incassoMese)} />
        {data.guadagnoMese !== null && (
          <StatCard label="Guadagno stimato (mese)" value={formatEUR(data.guadagnoMese)} accent />
        )}
      </div>

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-500">Prodotti più venduti</h2>
        {data.topProdotti.length === 0 ? (
          <p className="text-slate-400">🧾 Nessuna vendita ancora registrata.</p>
        ) : (
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
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? 'text-green-700' : 'text-slate-800'}`}>{value}</p>
    </div>
  )
}
