import { useEffect, useMemo, useState } from 'react'
import AppShell from './components/AppShell'
import FilterBar from './components/FilterBar'
import MapView, { type BBox } from './components/MapView'
import DealList from './components/DealList'
import { useDebounced } from './hooks/useDebounced'
import type { DealToday } from './types'
// import LoginBox from './components/LoginBox'; // enable when auth UI is ready

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'
type Filters = { city?: string; cuisine?: string[] }

export default function App() {
  const [filters, setFilters] = useState<Filters>({ city: 'Milton' })
  const [bbox, setBbox] = useState<BBox | null>(null)
  const [deals, setDeals] = useState<DealToday[]>([])
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`${API}/v1/deals/today?${queryString}`)
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(String(r.status)))
      )
      .then((d) => setDeals(d.items ?? []))
      .catch((e) => setError(e.message || 'Failed to load deals'))
      .finally(() => setLoading(false))
  }, [queryString])

  return (
    <AppShell
      header={
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold">
            Munch — Today’s Deals
          </h1>
          <span className="text-sm text-slate-600">Pickup only</span>
        </div>
      }
      filters={<FilterBar value={filters} onChange={setFilters} />}
      map={
        <MapView
          deals={deals}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
          onBoundsChange={setBbox}
        />
      }
      sheet={
        <section className="space-y-2">
          {loading && <div className="card">Loading deals...</div>}
          {error && <div className="card text-red-600">Error: {error}</div>}
          {!loading && !error && !deals.length && (
            <div className="card text-sm text-slate-600">
              No deals found. Try zooming out or clearing filters.
            </div>
          )}
          {!loading && !error && deals.length > 0 && (
            <DealList
              items={deals}
              loading={false}
              error={null}
              onSelect={(d) => setSelectedId(d.deal_id)}
            />
          )}
        </section>
      }
    />
  )
}
