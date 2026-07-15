interface EmptyStateProps {
  icon: string
  message: string
}

export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="mt-16 flex flex-col items-center gap-2 px-6 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="max-w-xs text-slate-400">{message}</p>
    </div>
  )
}
