import { useEffect, useMemo, useRef, useState } from 'react'
import FilterBar, {
  type Filters as LegacyFilters,
} from './components/FilterBar'
import MapView from './components/MapView'
import DealList from './components/DealList'
import type { DealToday, UiFilters } from './types'

const API_BASE = 'http://localhost:4000'

export default function App() {
  // Internal filter model (compatible with UiFilters)
  const [filters, setFilters] = useState<UiFilters>({ city: 'Milton' })
  const [deals, setDeals] = useState<DealToday[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Optional: convert FilterBar (legacy) to UiFilters
  const onFilterChange = (f: LegacyFilters) => {
    setFilters((prev) => ({
      ...prev,
      city: f.city || undefined,
      cuisine: f.cuisine,
      now: new Date().toISOString(), // always pass 'now' so server filters time/day
    }))
  }

  // Build querystring whenever filters change
  const queryString = useMemo(() => {
    const u = new URLSearchParams()
    if (filters.city) u.set('city', filters.city)
    if (filters.cuisine?.length) u.set('cuisine', filters.cuisine.join(','))
    if (filters.now) u.set('now', filters.now)
    if (filters.limit) u.set('limit', String(Math.min(filters.limit, 100)))
    // If you later wire map → bbox, it would be: u.set("bbox", `${s},${w},${n},${e}`)
    return u.toString()
  }, [filters])

  // Keep a ref to abort in-flight fetches on rapid filter changes/unmount
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    fetch(`${API_BASE}/v1/deals/today?${queryString}`, { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) {
          const msg = await r.text().catch(() => r.statusText)
          throw new Error(msg || `HTTP ${r.status}`)
        }
        return r.json() as Promise<{ items: DealToday[] }>
      })
      .then((data) => setDeals(data.items ?? []))
      .catch((e) => {
        if (e.name !== 'AbortError')
          setError(e.message || 'Failed to load deals.')
      })
      .finally(() => setLoading(false))

    return () => ctrl.abort()
  }, [queryString])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Munch — Today’s Deals</h1>
        </header>

        {/* Filters */}
        <FilterBar onChange={onFilterChange} />

        {/* Status */}
        {loading && (
          <div className="p-3 text-sm rounded-lg bg-blue-50 border border-blue-200">
            Loading today’s deals…
          </div>
        )}
        {error && (
          <div className="p-3 text-sm rounded-lg bg-red-50 border border-red-200">
            {error}
          </div>
        )}

        {/* Map + List */}
        <MapView deals={deals} />
        <DealList deals={deals} />
      </div>
    </div>
  )
}
