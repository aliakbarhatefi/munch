import { useCallback, useEffect, useMemo, useState } from 'react'
import FilterBar from './components/FilterBar'
import MapView from './components/MapView'
import DealList from './components/DealList'
import type { BBox, DealToday, Filters } from './types'

const API = 'http://localhost:4000'

export default function App() {
  const [filters, setFilters] = useState<Filters>({ city: 'Milton' })
  const [bbox, setBbox] = useState<BBox | null>(null)
  const [deals, setDeals] = useState<DealToday[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const query = useMemo(() => {
    const u = new URLSearchParams()
    u.set('now', new Date().toISOString())
    if (filters.city) u.set('city', filters.city)
    if (filters.cuisine?.length) u.set('cuisine', filters.cuisine.join(','))
    if (bbox)
      u.set('bbox', `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`)
    return u.toString()
  }, [filters, bbox])

  const fetchDeals = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch(`${API}/v1/deals/today?${query}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then((data) => setDeals(data.items ?? []))
      .catch((e) => setError(e.message || 'Failed to load deals'))
      .finally(() => setLoading(false))
  }, [query])

  useEffect(() => {
    fetchDeals()
  }, [fetchDeals])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Munch</h1>
          <div className="text-sm opacity-70">Today’s pickup deals</div>
        </header>

        <FilterBar
          initial={filters}
          onChange={setFilters}
          onSearchClick={fetchDeals}
        />

        <MapView deals={deals} onBoundsChange={setBbox} />

        {error && (
          <div className="card text-sm text-red-700 bg-red-50 border-red-200">
            Error: {error}
          </div>
        )}

        <DealList deals={deals} loading={loading} />
      </div>
    </div>
  )
}
