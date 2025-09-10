import { useEffect, useMemo, useState } from 'react'
import FilterBar from './components/FilterBar'
import MapView from './components/MapView'
import DealList from './components/DealList'
import { useDebounced } from './hooks/useDebounced'
import type { BBox, DealToday, Filters } from './types'

const API = 'http://localhost:4000'

export default function App() {
  const [filters, setFilters] = useState<Filters>({ city: 'Milton' })
  const [bbox, setBbox] = useState<BBox | null>(null)
  const [deals, setDeals] = useState<DealToday[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Debounce filters so typing doesn't spam the API
  const debouncedFilters = useDebounced(filters, 300)

  const queryString = useMemo(() => {
    const p = new URLSearchParams()
    p.set('now', new Date().toISOString())
    if (debouncedFilters.city) p.set('city', debouncedFilters.city)
    if (debouncedFilters.cuisine?.length)
      p.set('cuisine', debouncedFilters.cuisine.join(','))
    if (bbox)
      p.set('bbox', `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`)
    return p.toString()
  }, [debouncedFilters, bbox])

  // Effect 1: fetch data when query changes
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`${API}/v1/deals/today?${queryString}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then((data) => {
        if (cancelled) return
        const items: DealToday[] = data?.items ?? []
        setDeals(items)
      })
      .catch((e) => !cancelled && setError(e.message || 'Failed to load deals'))
      .finally(() => !cancelled && setLoading(false))

    return () => {
      cancelled = true
    }
  }, [queryString])

  // Effect 2: clear selection if the selected deal is no longer in results
  useEffect(() => {
    if (selectedId && !deals.some((x) => x.deal_id === selectedId)) {
      setSelectedId(null)
    }
  }, [selectedId, deals])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Munch — Today’s Deals</h1>
        </header>

        <FilterBar value={filters} onChange={setFilters} />

        <MapView
          deals={deals}
          onBoundsChange={(b) => setBbox(b)}
          onSelect={(id) => setSelectedId(id)}
          selectedId={selectedId}
        />

        <DealList
          deals={deals}
          loading={loading}
          error={error}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
        />
      </div>
    </div>
  )
}
