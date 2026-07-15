import { useState } from 'react'
import type { Supplier } from '../../lib/types'
import type { SupplierInput } from '../../lib/suppliers'

interface SupplierFormProps {
  supplier?: Supplier
  onSave: (input: SupplierInput) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

export function SupplierForm({ supplier, onSave, onDelete, onClose }: SupplierFormProps) {
  const [nome, setNome] = useState(supplier?.nome ?? '')
  const [telefono, setTelefono] = useState(supplier?.telefono ?? '')
  const [note, setNote] = useState(supplier?.note ?? '')
  const [saving, setSaving] = useState(false)

  const valido = nome.trim().length > 0

  async function handleSave() {
    if (!valido || saving) return
    setSaving(true)
    try {
      await onSave({
        nome: nome.trim(),
        telefono: telefono.trim() || undefined,
        note: note.trim() || undefined,
      })
      onClose()
    } catch (err) {
      console.error('salvataggio fornitore fallito', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!onDelete) return
    if (!confirm(`Eliminare "${supplier?.nome}"?`)) return
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
          {supplier ? 'Modifica fornitore' : 'Nuovo fornitore'}
        </h1>
        <div className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-5">
          <Field label="Nome fornitore">
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Es. Ceramiche Sicilia"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg"
              autoFocus
            />
          </Field>

          <Field label="Telefono (opzionale)">
            <input
              type="tel"
              inputMode="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Es. 333 1234567"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg"
            />
          </Field>

          <Field label="Note (opzionale)">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg"
            />
          </Field>

          {onDelete && (
            <button type="button" onClick={handleDelete} className="py-2 text-center font-medium text-red-500">
              Elimina fornitore
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
