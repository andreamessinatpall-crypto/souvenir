import { useState } from 'react'
import type { Product } from '../../lib/types'
import type { ProductInput } from '../../lib/products'
import { PhotoPicker } from '../../components/PhotoPicker'
import { Stepper } from '../../components/Stepper'
import { parseEuroInput } from '../../lib/format'

interface ProductFormProps {
  product?: Product
  defaultFornitoreId?: string
  onSave: (input: ProductInput) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

export function ProductForm({ product, defaultFornitoreId, onSave, onDelete, onClose }: ProductFormProps) {
  const [nome, setNome] = useState(product?.nome ?? '')
  const [categoria, setCategoria] = useState(product?.categoria ?? '')
  const [prezzo, setPrezzo] = useState(product?.prezzo?.toString() ?? '')
  const [quantita, setQuantita] = useState(product?.quantita?.toString() ?? '0')
  const [sogliaMinima, setSogliaMinima] = useState(product?.soglia_minima?.toString() ?? '3')
  const [costoAcquisto, setCostoAcquisto] = useState(product?.costo_acquisto?.toString() ?? '')
  const [foto, setFoto] = useState<string | undefined>(product?.foto)
  const [saving, setSaving] = useState(false)

  const valido = nome.trim().length > 0 && parseEuroInput(prezzo) >= 0

  async function handleSave() {
    if (!valido || saving) return
    setSaving(true)
    try {
      await onSave({
        nome: nome.trim(),
        categoria: categoria.trim() || undefined,
        prezzo: parseEuroInput(prezzo),
        quantita: Number.parseInt(quantita, 10) || 0,
        soglia_minima: Number.parseInt(sogliaMinima, 10) || 3,
        costo_acquisto: costoAcquisto.trim() ? parseEuroInput(costoAcquisto) : undefined,
        foto,
        fornitore_id: product?.fornitore_id ?? defaultFornitoreId,
      })
      onClose()
    } catch (err) {
      console.error('salvataggio prodotto fallito', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!onDelete) return
    if (!confirm(`Eliminare "${product?.nome}"?`)) return
    await onDelete()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <button type="button" onClick={onClose} className="text-2xl leading-none text-slate-500">
          ✕
        </button>
        <h1 className="text-lg font-semibold text-slate-800">
          {product ? 'Modifica prodotto' : 'Nuovo prodotto'}
        </h1>
        <div className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-5">
          <PhotoPicker value={foto} onChange={setFoto} />

          <Field label="Nome prodotto">
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Es. Calamita Cefalù"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg"
              autoFocus
            />
          </Field>

          <Field label="Categoria (opzionale)">
            <input
              type="text"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Es. Calamite"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg"
            />
          </Field>

          <Field label="Prezzo di vendita">
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={prezzo}
                onChange={(e) => setPrezzo(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">€</span>
            </div>
          </Field>

          <Field label="Giacenza">
            <Stepper value={Number.parseInt(quantita, 10) || 0} onChange={(v) => setQuantita(String(v))} />
          </Field>

          <Field label="Soglia scorta bassa">
            <Stepper value={Number.parseInt(sogliaMinima, 10) || 0} onChange={(v) => setSogliaMinima(String(v))} />
          </Field>

          <Field label="Costo di acquisto (opzionale)">
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={costoAcquisto}
                onChange={(e) => setCostoAcquisto(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">€</span>
            </div>
          </Field>

          {onDelete && (
            <button type="button" onClick={handleDelete} className="py-2 text-center font-medium text-red-500">
              Elimina prodotto
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 px-4 py-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={!valido || saving}
          className="w-full rounded-2xl bg-[#0b4468] py-4 text-lg font-semibold text-white disabled:opacity-40"
        >
          {saving ? 'Salvataggio...' : 'Salva'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      {children}
    </label>
  )
}
