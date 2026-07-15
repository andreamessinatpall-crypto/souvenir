interface StepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  step?: number
}

export function Stepper({ value, onChange, min = 0, step = 1 }: StepperProps) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-2xl font-semibold text-slate-700 active:bg-slate-200"
        aria-label="Diminuisci"
      >
        −
      </button>
      <span className="min-w-12 text-center text-2xl font-semibold tabular-nums text-slate-800">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + step)}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0b4468] text-2xl font-semibold text-white active:bg-[#093652]"
        aria-label="Aumenta"
      >
        +
      </button>
    </div>
  )
}
