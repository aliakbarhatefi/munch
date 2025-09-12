import {
  GoogleMap,
  useJsApiLoader,
  type Libraries,
} from '@react-google-maps/api'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { DealToday } from '../types'

export type BBox = { south: number; west: number; north: number; east: number }

type Props = {
  deals: DealToday[]
  onBoundsChange: (bbox: BBox) => void
  selectedId?: number
  onSelect?: (id: number) => void
}

const MAP_LIBRARIES: Libraries = ['places', 'marker']
const MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID as string | undefined

const MAP_OPTIONS_BASE: Partial<google.maps.MapOptions> = {
  disableDefaultUI: true,
  clickableIcons: false,
  gestureHandling: 'greedy',
}
const MAP_OPTIONS: Partial<google.maps.MapOptions> = MAP_ID
  ? { ...MAP_OPTIONS_BASE, mapId: MAP_ID }
  : MAP_OPTIONS_BASE

const IDLE_THROTTLE_MS = 400
const BOUNDS_EPS = 1e-4

export default function MapView({
  deals,
  onBoundsChange,
  selectedId,
  onSelect,
}: Props) {
  const center = useMemo<google.maps.LatLngLiteral>(() => {
    if (deals.length) return { lat: deals[0].lat, lng: deals[0].lng }
    return { lat: 43.65, lng: -79.38 }
  }, [deals])

  const { isLoaded } = useJsApiLoader({
    id: 'gmaps',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries: MAP_LIBRARIES,
  })

  const mapRef = useRef<google.maps.Map | null>(null)
  const advMarkers = useRef<
    Map<number, google.maps.marker.AdvancedMarkerElement>
  >(new Map())
  const advContent = useRef<Map<number, HTMLDivElement>>(new Map())
  const stdMarkers = useRef<Map<number, google.maps.Marker>>(new Map())
  const listeners = useRef<google.maps.MapsEventListener[]>([])
  const lastIdleAt = useRef<number>(0)
  const lastBbox = useRef<BBox | null>(null)

  const clearAllMarkers = useCallback(() => {
    listeners.current.forEach((l) => l.remove())
    listeners.current = []
    advMarkers.current.forEach((m) => (m.map = null))
    advMarkers.current.clear()
    advContent.current.clear()
    stdMarkers.current.forEach((m) => m.setMap(null))
    stdMarkers.current.clear()
  }, [])

  const handleLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  const handleUnmount = useCallback(() => {
    clearAllMarkers()
    mapRef.current = null
  }, [clearAllMarkers])

  const emitBoundsIfChanged = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const b = map.getBounds()
    if (!b) return
    const ne = b.getNorthEast()
    const sw = b.getSouthWest()
    const next: BBox = {
      south: sw.lat(),
      west: sw.lng(),
      north: ne.lat(),
      east: ne.lng(),
    }
    const prev = lastBbox.current
    if (
      !prev ||
      Math.abs(prev.south - next.south) > BOUNDS_EPS ||
      Math.abs(prev.west - next.west) > BOUNDS_EPS ||
      Math.abs(prev.north - next.north) > BOUNDS_EPS ||
      Math.abs(prev.east - next.east) > BOUNDS_EPS
    ) {
      lastBbox.current = next
      onBoundsChange(next)
    }
  }, [onBoundsChange])

  const handleIdle = useCallback(() => {
    const now = performance.now()
    if (now - lastIdleAt.current < IDLE_THROTTLE_MS) return
    lastIdleAt.current = now
    requestAnimationFrame(emitBoundsIfChanged)
  }, [emitBoundsIfChanged])

  function styleAdvanced(el: HTMLDivElement, isSelected: boolean) {
    el.style.width = '22px'
    el.style.height = '22px'
    el.style.borderRadius = '50%'
    el.style.boxSizing = 'border-box'
    el.style.border = '2px solid #ffffff'
    el.style.background = isSelected ? '#ef4444' : '#2563eb'
    el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.35)'
  }

  function iconFor(g: typeof google, isSelected: boolean): google.maps.Symbol {
    return {
      path: g.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: isSelected ? '#ef4444' : '#2563eb',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    }
  }

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return
    const g = window.google
    if (!g) return

    const canUseAdvanced =
      !!MAP_ID && !!g.maps.marker && !!g.maps.marker.AdvancedMarkerElement

    const map = mapRef.current
    const ids = new Set<number>(deals.map((d) => d.deal_id))

    if (canUseAdvanced) {
      advMarkers.current.forEach((marker, id) => {
        if (!ids.has(id)) {
          marker.map = null
          advMarkers.current.delete(id)
          advContent.current.delete(id)
        }
      })
    } else {
      stdMarkers.current.forEach((marker, id) => {
        if (!ids.has(id)) {
          marker.setMap(null)
          stdMarkers.current.delete(id)
        }
      })
    }

    deals.forEach((d) => {
      if (canUseAdvanced) {
        let marker = advMarkers.current.get(d.deal_id)
        let el = advContent.current.get(d.deal_id)
        if (!marker || !el) {
          el = document.createElement('div')
          styleAdvanced(el, selectedId === d.deal_id)
          marker = new g.maps.marker.AdvancedMarkerElement({
            position: { lat: d.lat, lng: d.lng },
            map,
            content: el,
          })
          const listener = marker.addListener('gmp-click', () =>
            onSelect?.(d.deal_id)
          )
          listeners.current.push(listener)
          advMarkers.current.set(d.deal_id, marker)
          advContent.current.set(d.deal_id, el)
        } else {
          marker.position = new g.maps.LatLng(d.lat, d.lng)
          styleAdvanced(el, selectedId === d.deal_id)
        }
      } else {
        let marker = stdMarkers.current.get(d.deal_id)
        if (!marker) {
          marker = new g.maps.Marker({
            position: { lat: d.lat, lng: d.lng },
            map,
            icon: iconFor(g, selectedId === d.deal_id),
          })
          const listener = marker.addListener('click', () =>
            onSelect?.(d.deal_id)
          )
          listeners.current.push(listener)
          stdMarkers.current.set(d.deal_id, marker)
        } else {
          marker.setPosition({ lat: d.lat, lng: d.lng })
          marker.setIcon(iconFor(g, selectedId === d.deal_id))
        }
      }
    })
  }, [deals, selectedId, onSelect, isLoaded])

  if (!isLoaded) return <div className="h-[65vh] w-full card">Loading map…</div>

  return (
    <div className="h-[65vh] w-full">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={13}
        options={MAP_OPTIONS as google.maps.MapOptions}
        onLoad={handleLoad}
        onUnmount={handleUnmount}
        onIdle={handleIdle}
      />
    </div>
  )
}
