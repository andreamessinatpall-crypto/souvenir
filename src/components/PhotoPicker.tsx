import { useRef } from 'react'
import { compressImage } from '../lib/image'

interface PhotoPickerProps {
  value?: string
  onChange: (dataUrl: string | undefined) => void
}

export function PhotoPicker({ value, onChange }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    try {
      const compressed = await compressImage(file)
      onChange(compressed)
    } catch (err) {
      console.error('compressione foto fallita', err)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-3xl text-slate-400"
      >
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : '📷'}
      </button>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 active:bg-slate-100"
        >
          {value ? 'Cambia foto' : 'Aggiungi foto'}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-sm font-medium text-red-500"
          >
            Rimuovi foto
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
