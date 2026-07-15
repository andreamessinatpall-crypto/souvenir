import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { db } from '../lib/db'

export function SyncIndicator() {
  const pendingCount = useLiveQuery(() => db.sync_queue.count(), []) ?? 0
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  const synced = online && pendingCount === 0

  return (
    <span
      className={`h-2.5 w-2.5 shrink-0 rounded-full ${synced ? 'bg-green-500' : 'bg-slate-300'}`}
      title={synced ? 'Sincronizzato' : 'In attesa di rete'}
    />
  )
}
