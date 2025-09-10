import { useEffect, useMemo, useState } from 'react'

import AppShell from '@/components/AppShell'
import Header from '@/components/Header'
import FilterBar, { type Filters } from '@/components/FilterBar'
import BottomSheet from '@/components/BottomSheet'
import DealList from '@/components/DealList'
import FloatingControls from '@/components/FloatingControls'
import MapView, { type BBox } from '@/components/MapView'
import PlaceAutocomplete from '@/components/PlaceAutocomplete'

import type { DealToday } from '@/types'

import MapProvider from '@/map/MapProvider'
import { useMapCtx } from '@/map/context'

// You can set this in .env (Vite) as VITE_API_URL
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

function AppInner() {
  const [filters, setFilters] = useState<Filters>({ city: 'Milton' })
  const [bbox, setBbox] = useState<BBox | null>(null)

  const [items, setItems] = useState<DealToday[]>([])
  const [selectedId, setSelectedId] = useState<number>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(true)

  const { panTo } = useMapCtx()

  // Build query string from filters + bbox
  const qs = useMemo(() => {
    const u = new URLSearchParams()
    u.set('now', new Date().toISOString())
    if (filters.city) u.set('city', filters.city)
    if (filters.cuisine?.length) u.set('cuisine', filters.cuisine.join(','))
    if (filters.price) u.set('price', filters.price)
    if (bbox)
      u.set('bbox', `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`)
    if (filters.openNow) u.set('openNow', '1')
    return u.toString()
  }, [filters, bbox])

  // Fetch deals whenever qs changes
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`${API}/v1/deals/today?${qs}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then((d) => {
        if (!cancelled) setItems(d.items ?? [])
      })
      .catch((e) => {
        if (!cancelled) setError(e.message ?? 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [qs])

  const header = (
    <Header>
      <PlaceAutocomplete
        className="px-3 py-2 rounded-xl border w-full"
        placeholder="Search by place or address…"
        onPlace={({ lat, lng }) => {
          panTo(lat, lng) // pan the map
          setSheetOpen(true) // show sheet
        }}
      />
    </Header>
  )

  const filtersBar = <FilterBar value={filters} onChange={setFilters} />

  const map = (
    <div className="relative">
      <MapView
        deals={items}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id)
          setSheetOpen(true)
        }}
        onBoundsChange={setBbox}
      />
      <FloatingControls
        onLocate={() => {
          if (!navigator.geolocation) return
          navigator.geolocation.getCurrentPosition((pos) => {
            panTo(pos.coords.latitude, pos.coords.longitude)
            setSheetOpen(true)
          })
        }}
        onOpenFilters={() => setSheetOpen(true)}
      />
    </div>
  )

  const sheet = (
    <BottomSheet
      open={sheetOpen}
      onClose={() => setSheetOpen(false)}
      title="Today’s Deals"
    >
      <DealList
        items={items}
        loading={loading}
        error={error}
        onSelect={(d) => setSelectedId(d.deal_id)}
      />
    </BottomSheet>
  )

  return (
    <AppShell header={header} filters={filtersBar} map={map} sheet={sheet} />
  )
}

export default function App() {
  return (
    <MapProvider>
      <AppInner />
    </MapProvider>
  )
}
