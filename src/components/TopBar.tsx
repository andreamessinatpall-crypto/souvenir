import { supabase } from '../lib/supabaseClient'
import { SyncIndicator } from './SyncIndicator'

export function TopBar() {
  async function handleLogout() {
    if (!confirm('Uscire dall\'app?')) return
    await supabase.auth.signOut()
  }

  return (
    <div
      className="fixed right-3 z-10 flex items-center gap-3"
      style={{ top: 'calc(env(safe-area-inset-top) + 8px)' }}
    >
      <SyncIndicator />
      <button
        type="button"
        onClick={handleLogout}
        aria-label="Esci"
        title="Esci"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-sm active:bg-slate-100"
      >
        🚪
      </button>
    </div>
  )
}
