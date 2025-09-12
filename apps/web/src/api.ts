export const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export async function login(email: string, password: string) {
  const r = await fetch(`${API}/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!r.ok) throw new Error(await r.text())
  return (await r.json()) as { accessToken: string; refreshToken: string }
}
