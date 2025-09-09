import { useEffect, useMemo, useState } from 'react'
import FilterBar, { type Filters } from './components/FilterBar'
import MapView from './components/MapView'
import type { DealToday } from './types' // <-- use the canonical type

/** Adjust if your API runs elsewhere */
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000'

export default function App() {
  const [filters, setFilters] = useState<Filters>({ city: 'Milton' })
  const [deals, setDeals] = useState<DealToday[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** Build querystring from filters (only include supported params) */
  const query = useMemo(() => {
    const u = new URLSearchParams()

    if (filters.city) u.set('city', filters.city)
    if (filters.cuisine?.length) u.set('cuisine', filters.cuisine.join(','))
    if (filters.price) u.set('price', filters.price)
    if (typeof filters.minRating === 'number' && filters.minRating > 0) {
      u.set('minRating', String(filters.minRating))
    }
    u.set('now', filters.timeISO ?? new Date().toISOString())

    return u.toString()
  }, [filters])

  /** Fetch deals whenever filters change */
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`${API_BASE}/v1/deals/today?${query}`)
      .then(async (r) => {
        if (!r.ok) {
          const txt = await r.text().catch(() => '')
          throw new Error(`${r.status} ${r.statusText} ${txt}`.trim())
        }
        return r.json()
      })
      .then((data) => {
        if (cancelled) return
        const items = Array.isArray(data?.items)
          ? (data.items as DealToday[])
          : []
        setDeals(items)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Failed to load deals')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [query])

  /** Optional: geolocate hook */
  function handleLocateMe() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('Located:', pos.coords.latitude, pos.coords.longitude)
        // Later: setFilters(f => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
      },
      (err) => console.warn('Geolocation error:', err),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 10_000 }
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-white/60 backdrop-blur">
        <div className="mx-auto max-w-6xl p-3 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
            Munch
          </h1>
          <div className="text-xs md:text-sm opacity-60">
            Today’s pickup deals
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-6xl px-3 py-3 space-y-3">
        {/* Filters */}
        <div className="rounded-2xl shadow-sm bg-white/70 border backdrop-blur p-3">
          <FilterBar
            initial={filters}
            onChange={setFilters}
            onLocateMe={handleLocateMe}
          />
        </div>

        {/* Map */}
        <div className="rounded-2xl overflow-hidden shadow bg-white">
          <MapView deals={deals} loading={loading} />
        </div>

        {/* List */}
        <section className="rounded-2xl shadow bg-white/90 backdrop-blur">
          <header className="flex items-center justify-between p-3 border-b">
            <h2 className="text-base md:text-lg font-semibold">Results</h2>
            <span className="text-xs opacity-60">
              {deals.length} deal{deals.length === 1 ? '' : 's'}
            </span>
          </header>

          {error && <div className="p-3 text-sm text-red-600">{error}</div>}

          {loading ? (
            <div className="p-4 text-sm animate-pulse">Loading deals…</div>
          ) : (
            <ul className="divide-y">
              {deals.map((d) => (
                <li key={d.deal_id} className="p-4 hover:bg-slate-50">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">
                        {d.title} <span className="opacity-70">· {d.name}</span>
                      </div>
                      <div className="text-sm opacity-80 truncate">
                        {d.address}, {d.city}
                      </div>
                      <div className="text-xs opacity-60">
                        {d.start_time}–{d.end_time} •{' '}
                        {d.cuisine_tags.join(', ')}
                      </div>
                    </div>
                    <div className="self-start shrink-0">
                      <span className="inline-block text-sm px-2 py-1 rounded-xl bg-black text-white">
                        {formatDiscount(d)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
              {deals.length === 0 && !error && (
                <li className="p-4 text-sm opacity-70">No deals found.</li>
              )}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}

/* ---------------- helpers ---------------- */

function formatDiscount(d: DealToday) {
  if (d.discount_type === 'PERCENT') return `${d.discount_value}%`
  if (d.discount_type === 'FIXED') return `$${d.discount_value}`
  return d.discount_type
}
