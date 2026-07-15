import { useState } from 'react'
import { ProductList } from './magazzino/ProductList'
import { SupplierList } from './magazzino/SupplierList'

type Vista = 'prodotti' | 'fornitori'

export function Magazzino() {
  const [vista, setVista] = useState<Vista>('prodotti')

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-2 px-4 pt-4">
        <SegmentButton label="Prodotti" active={vista === 'prodotti'} onClick={() => setVista('prodotti')} />
        <SegmentButton label="Fornitori" active={vista === 'fornitori'} onClick={() => setVista('fornitori')} />
      </div>

      <div className="flex-1 overflow-hidden">
        {vista === 'prodotti' ? <ProductList /> : <SupplierList />}
      </div>
    </div>
  )
}

function SegmentButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
        active ? 'bg-[#0b4468] text-white' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {label}
    </button>
  )
}
