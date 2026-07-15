import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Product } from '../../lib/types'
import type { ProductInput } from '../../lib/products'
import { PhotoPicker } from '../../components/PhotoPicker'
import { Stepper } from '../../components/Stepper'
import { formatEuroInput, parseEuroInput } from '../../lib/format'
import { db } from '../../lib/db'
import { createSupplier } from '../../lib/suppliers'
import { transferToStore } from '../../lib/products'
import { SupplierForm } from './SupplierForm'

const NUOVO_FORNITORE = '__nuovo__'
const NUOVA_CATEGORIA = '__nuova__'

interface ProductFormProps {
  product?: Product
  defaultFornitoreId?: string
  onSave: (input: ProductInput) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

export function ProductForm({ product, defaultFornitoreId, onSave, onDelete, onClose }: ProductFormProps) {
  const suppliers = useLiveQuery(() => db.suppliers.orderBy('nome').toArray(), [])
  const categorie = useLiveQuery(async () => {
    const products = await db.products.toArray()
    const set = new Set<string>()
    for (const p of products) {
      if (p.categoria?.trim()) set.add(p.categoria.trim())
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [])
  const [nome, setNome] = useState(product?.nome ?? '')
  const [categoria, setCategoria] = useState(product?.categoria ?? '')
  const [nuovaCategoria, setNuovaCategoria] = useState(false)
  const [prezzo, setPrezzo] = useState(product ? formatEuroInput(product.prezzo) : '')
  const [quantitaNegozio, setQuantitaNegozio] = useState(product?.quantita_negozio?.toString() ?? '0')
  const [quantitaScorta, setQuantitaScorta] = useState(product?.quantita_scorta?.toString() ?? '0')
  const [sogliaMinima, setSogliaMinima] = useState(product?.soglia_minima?.toString() ?? '3')
  const [costoAcquisto, setCostoAcquisto] = useState(
    product?.costo_acquisto !== undefined ? formatEuroInput(product.costo_acquisto) : '',
  )
  const [fornitoreId, setFornitoreId] = useState(product?.fornitore_id ?? defaultFornitoreId ?? '')
  const [foto, setFoto] = useState<string | undefined>(product?.foto)
  const [saving, setSaving] = useState(false)
  const [creatingSupplier, setCreatingSupplier] = useState(false)
  const [daSpostare, setDaSpostare] = useState(1)
  const [spostando, setSpostando] = useState(false)

  const valido =
    nome.trim().length > 0 && parseEuroInput(prezzo) >= 0 && fornitoreId !== '' && categoria.trim() !== ''

  async function handleSave() {
    if (!valido || saving) return
    setSaving(true)
    try {
      await onSave({
        nome: nome.trim(),
        categoria: categoria.trim(),
        prezzo: parseEuroInput(prezzo),
        quantita_negozio: Number.parseInt(quantitaNegozio, 10) || 0,
        quantita_scorta: Number.parseInt(quantitaScorta, 10) || 0,
        soglia_minima: Number.parseInt(sogliaMinima, 10) || 3,
        costo_acquisto: costoAcquisto.trim() ? parseEuroInput(costoAcquisto) : undefined,
        foto,
        fornitore_id: fornitoreId,
      })
      onClose()
    } catch (err) {
      console.error('salvataggio prodotto fallito', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleTransfer() {
    if (!product || spostando) return
    const scortaAttuale = Number.parseInt(quantitaScorta, 10) || 0
    const n = Math.min(daSpostare, scortaAttuale)
    if (n <= 0) return
    setSpostando(true)
    try {
      await transferToStore(product.id, n)
      setQuantitaNegozio(String((Number.parseInt(quantitaNegozio, 10) || 0) + n))
      setQuantitaScorta(String(scortaAttuale - n))
      setDaSpostare(1)
    } catch (err) {
      console.error('travaso fallito', err)
    } finally {
      setSpostando(false)
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

          <Field label="Fornitore">
            {suppliers?.length === 0 ? (
              <button
                type="button"
                onClick={() => setCreatingSupplier(true)}
                className="w-full rounded-xl border-2 border-dashed border-slate-300 py-3 text-center font-medium text-slate-500"
              >
                + Aggiungi il primo fornitore
              </button>
            ) : (
              <select
                value={fornitoreId}
                onChange={(e) => {
                  if (e.target.value === NUOVO_FORNITORE) setCreatingSupplier(true)
                  else setFornitoreId(e.target.value)
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg"
              >
                <option value="" disabled>
                  Seleziona un fornitore
                </option>
                {suppliers?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
                <option value={NUOVO_FORNITORE}>+ Nuovo fornitore</option>
              </select>
            )}
          </Field>

          <Field label="Etichetta">
            {nuovaCategoria || categorie?.length === 0 ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Es. Calamite"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg"
                  autoFocus
                />
                {categorie && categorie.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setNuovaCategoria(false)
                      setCategoria('')
                    }}
                    className="self-start text-sm font-medium text-slate-500"
                  >
                    ← Scegli tra quelle esistenti
                  </button>
                )}
              </div>
            ) : (
              <select
                value={categoria}
                onChange={(e) => {
                  if (e.target.value === NUOVA_CATEGORIA) setNuovaCategoria(true)
                  else setCategoria(e.target.value)
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg"
              >
                <option value="" disabled>
                  Seleziona un&apos;etichetta
                </option>
                {categorie?.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value={NUOVA_CATEGORIA}>+ Nuova etichetta</option>
              </select>
            )}
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

          <Field label="In negozio">
            <Stepper
              value={Number.parseInt(quantitaNegozio, 10) || 0}
              onChange={(v) => setQuantitaNegozio(String(v))}
            />
          </Field>

          <Field label="Scorta (scatoli)">
            <Stepper
              value={Number.parseInt(quantitaScorta, 10) || 0}
              onChange={(v) => setQuantitaScorta(String(v))}
            />
          </Field>

          {product && (Number.parseInt(quantitaScorta, 10) || 0) > 0 && (
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="mb-2 text-sm font-medium text-slate-500">Sposta dalla scorta al negozio</p>
              <div className="flex items-center gap-3">
                <Stepper value={daSpostare} onChange={setDaSpostare} min={1} />
                <button
                  type="button"
                  onClick={handleTransfer}
                  disabled={spostando}
                  className="flex-1 rounded-xl bg-[#0b4468] py-3 font-semibold text-white disabled:opacity-40"
                >
                  {spostando ? 'Sposto...' : 'Sposta →'}
                </button>
              </div>
            </div>
          )}

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

      {creatingSupplier && (
        <SupplierForm
          onClose={() => setCreatingSupplier(false)}
          onSave={async (input) => {
            const id = await createSupplier(input)
            setFornitoreId(id)
          }}
        />
      )}
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
