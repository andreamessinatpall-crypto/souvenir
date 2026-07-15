import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Registra } from './screens/Registra'
import { Magazzino } from './screens/Magazzino'
import { Report } from './screens/Report'
import { Login } from './screens/Login'
import { TopBar } from './components/TopBar'
import { supabase } from './lib/supabaseClient'
import { startSyncEngine } from './lib/sync'

type Tab = 'registra' | 'magazzino' | 'report'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'registra', label: 'Registra', icon: '📝' },
  { id: 'magazzino', label: 'Magazzino', icon: '📦' },
  { id: 'report', label: 'Report', icon: '📊' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('registra')
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    return startSyncEngine()
  }, [session])

  if (session === undefined) return null
  if (session === null) return <Login />

  return (
    <div className="flex h-dvh flex-col bg-slate-50">
      <TopBar />
      <main className="flex-1 overflow-hidden" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 56px)' }}>
        {tab === 'registra' && <Registra />}
        {tab === 'magazzino' && <Magazzino />}
        {tab === 'report' && <Report />}
      </main>

      <nav
        className="grid grid-cols-3 border-t border-slate-200 bg-white"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-1 py-3 text-sm font-medium transition-colors ${
              tab === t.id ? 'text-[#0b4468]' : 'text-slate-400'
            }`}
          >
            <span className="text-2xl leading-none">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
