import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError('Email o password non corretti.')
  }

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-[#0b4468] px-6">
      <div className="w-full max-w-xs">
        <h1 className="mb-8 text-center text-2xl font-semibold text-white">Souvenir Cefalù</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            inputMode="email"
            autoComplete="username"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border-0 px-4 py-3 text-lg"
            required
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border-0 px-4 py-3 text-lg"
            required
          />
          {error && <p className="text-center text-sm text-orange-200">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-2xl bg-white py-4 text-lg font-semibold text-[#0b4468] disabled:opacity-60"
          >
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  )
}
