import { useState } from 'react'
import { login } from '../api'

export default function LoginBox({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('owner@example.com')
  const [password, setPassword] = useState('password123')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  return (
    <form
      className="card space-y-2 max-w-md"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setErr(null)
        try {
          const { accessToken, refreshToken } = await login(email, password)
          localStorage.setItem('munch:access', accessToken)
          localStorage.setItem('munch:refresh', refreshToken)
          onSuccess()
        } catch (e: unknown) {
          setErr(e instanceof Error ? e.message : 'Login failed')
        } finally {
          setBusy(false)
        }
      }}
    >
      <h2 className="text-lg font-semibold">Owner login</h2>
      {err && <div className="text-red-600 text-sm">{err}</div>}
      <input
        className="input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        className="input"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button className="btn" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
