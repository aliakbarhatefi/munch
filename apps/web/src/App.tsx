import { useEffect, useMemo, useState } from 'react'
import { APIProvider } from '@vis.gl/react-google-maps'
import MapView from './components/MapView'
import BottomSheet from './components/BottomSheet'
import FilterBar, { type Filters } from './components/FilterBar'
import type { DealToday } from './types'
import { asDealsArray } from './types'

const API_BASE = 'http://localhost:4000'

export default function App() {
  const [filters, setFilters] = useState<Filters>({ city: 'Milton' })
  const [deals, setDeals] = useState<DealToday[]>([])
  const [loading, setLoading] = useState(false)

  const qs = useMemo(() => {
    const u = new URLSearchParams()
    if (filters.city) u.set('city', filters.city)
    if (filters.cuisine?.length) u.set('cuisine', filters.cuisine.join(','))
    u.set('now', new Date().toISOString())
    return u.toString()
  }, [filters])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`${API_BASE}/v1/deals/today?${qs}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const data = await r.json()
        return asDealsArray(data)
      })
      .then((items) => {
        if (!cancelled) setDeals(items)
      })
      .catch((err) => {
        console.error('fetch deals failed', err)
        if (!cancelled) setDeals([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [qs])

  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
        <header className="sticky top-0 z-20 backdrop-blur bg-white/60 border-b">
          <div className="max-w-6xl mx-auto p-3 flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              Munch
            </h1>
            <div className="text-xs md:text-sm opacity-60">
              Today’s pickup deals
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-3 py-3 space-y-3">
          <FilterBar onChange={setFilters} />
          <div className="rounded-2xl overflow-hidden shadow">
            <MapView deals={deals} loading={loading} />
          </div>
          <div className="hidden md:block">
            <BottomSheet deals={deals} desktop />
          </div>
        </main>

        <div className="md:hidden">
          <BottomSheet deals={deals} />
        </div>
      </div>
    </APIProvider>
  )
}
