import { useState } from 'react'
import type { CartLine } from '../../lib/sales'
import { createSale } from '../../lib/sales'
import { formatEUR } from '../../lib/format'
import { Stepper } from '../../components/Stepper'
import type { MetodoPagamento } from '../../lib/types'

interface CartSummaryProps {
  lines: CartLine[]
  onChangeQuantity: (productId: string, quantita: number) => void
  onClose: () => void
  onConfirmed: () => void
}

export function CartSummary({ lines, onChangeQuantity, onClose, onConfirmed }: CartSummaryProps) {
  const [metodo, setMetodo] = useState<MetodoPagamento | null>(null)
  const [saving, setSaving] = useState(false)

  const totale = lines.reduce((sum, l) => sum + l.product.prezzo * l.quantita, 0)

  async function handleConfirm() {
    if (!metodo || lines.length === 0 || saving) return
    setSaving(true)
    try {
      await createSale(lines, metodo)
      onConfirmed()
    } catch (err) {
      console.error('registrazione vendita fallita', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <button type="button" onClick={onClose} className="text-2xl leading-none text-slate-500">
          ✕
        </button>
        <h1 className="text-lg font-semibold text-slate-800">Riepilogo vendita</h1>
        <div className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {lines.length === 0 ? (
          <p className="mt-12 text-center text-slate-400">🛒 Il carrello è vuoto.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {lines.map((line) => (
              <li key={line.product.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{line.product.nome}</p>
                  <p className="text-sm text-slate-500">{formatEUR(line.product.prezzo)} cad.</p>
                </div>
                <Stepper value={line.quantita} onChange={(v) => onChangeQuantity(line.product.id, v)} min={0} />
              </li>
            ))}
          </ul>
        )}

        {lines.length > 0 && (
          <div className="mt-8">
            <p className="mb-2 text-sm font-medium text-slate-500">Metodo di pagamento</p>
            <div className="grid grid-cols-2 gap-3">
              <PaymentButton label="Contanti" icon="💶" active={metodo === 'contanti'} onClick={() => setMetodo('contanti')} />
              <PaymentButton label="Carta" icon="💳" active={metodo === 'carta'} onClick={() => setMetodo('carta')} />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 px-4 py-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
        <div className="mb-3 flex items-center justify-between text-lg">
          <span className="font-medium text-slate-600">Totale</span>
          <span className="text-2xl font-bold text-slate-800">{formatEUR(totale)}</span>
        </div>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!metodo || lines.length === 0 || saving}
          className="w-full rounded-2xl bg-[#0b4468] py-4 text-lg font-semibold text-white disabled:opacity-40"
        >
          {saving ? 'Registrazione...' : 'Conferma vendita'}
        </button>
      </div>
    </div>
  )
}

function PaymentButton({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-4 text-base font-semibold transition-colors ${
        active ? 'border-[#0b4468] bg-[#0b4468]/5 text-[#0b4468]' : 'border-slate-200 text-slate-500'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      {label}
    </button>
  )
}
