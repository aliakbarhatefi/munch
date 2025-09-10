import { useCallback, useMemo, useRef, useState } from 'react'
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api'
import type { DealToday, BBox } from '../types'
import { useMapApi } from '../map/useMapApi'

const DEFAULT_CENTER = { lat: 43.65, lng: -79.38 }
const CONTAINER_STYLE = { height: '65vh', width: '100%' } as const

const MAP_OPTIONS: google.maps.MapOptions = {
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  gestureHandling: 'greedy',
  clickableIcons: false,
}

// Pan to user's location + drop a blue dot
const locateMe = (
  map: google.maps.Map | null,
  setUserPos: (pos: google.maps.LatLngLiteral | null) => void
) => {
  if (!map || !navigator.geolocation) return
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords
    const where = new google.maps.LatLng(latitude, longitude)
    map.panTo(where)
    map.setZoom(14)
    setUserPos({ lat: latitude, lng: longitude })
  })
}

// requestAnimationFrame throttle (typed)
function useRafThrottle<T extends (...args: unknown[]) => void>(fn: T): T {
  const ticking = useRef(false)
  return ((...args: Parameters<T>) => {
    if (ticking.current) return
    ticking.current = true
    requestAnimationFrame(() => {
      ticking.current = false
      fn(...args)
    })
  }) as T
}

type Props = {
  deals: DealToday[]
  onBoundsChange: (bbox: BBox) => void
  onSelect?: (id: number | null) => void
  selectedId?: number | null
}

export default function MapView({
  deals,
  onBoundsChange,
  onSelect,
  selectedId,
}: Props) {
  const { isLoaded, loadError } = useMapApi()

  const mapRef = useRef<google.maps.Map | null>(null)
  const [userPos, setUserPos] = useState<google.maps.LatLngLiteral | null>(null)
  const initialisedCenter = useRef(false)

  const selected = useMemo(
    () =>
      selectedId != null ? deals.find((d) => d.deal_id === selectedId) : null,
    [deals, selectedId]
  )

  const initialCenter = useMemo(
    () =>
      deals.length ? { lat: deals[0].lat, lng: deals[0].lng } : DEFAULT_CENTER,
    [deals]
  )

  const emitBounds = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const b = map.getBounds()
    if (!b) return
    const ne = b.getNorthEast()
    const sw = b.getSouthWest()
    onBoundsChange({
      south: sw.lat(),
      west: sw.lng(),
      north: ne.lat(),
      east: ne.lng(),
    })
  }, [onBoundsChange])

  const onMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map
      if (!initialisedCenter.current) {
        initialisedCenter.current = true
        map.setCenter(initialCenter)
        map.setZoom(13)
      }
      google.maps.event.addListenerOnce(map, 'idle', () => {
        emitBounds()
      })
    },
    [initialCenter, emitBounds]
  )

  const onUnmount = useCallback(() => {
    mapRef.current = null
    initialisedCenter.current = false
  }, [])

  const onIdle = useRafThrottle(() => {
    emitBounds()
  })

  if (loadError)
    return <div className="card text-red-600">Failed to load Google Maps</div>
  if (!isLoaded) return <div className="card">Loading map…</div>

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden shadow"
      style={{ height: CONTAINER_STYLE.height }}
    >
      <button
        onClick={() => locateMe(mapRef.current, setUserPos)}
        className="btn btn-secondary absolute z-[1] m-3 top-2 left-2"
      >
        Locate me
      </button>

      <GoogleMap
        onLoad={onMapLoad}
        onUnmount={onUnmount}
        onIdle={onIdle}
        mapContainerStyle={{ height: '100%', width: '100%' }}
        options={MAP_OPTIONS}
      >
        {deals.map((d) => (
          <Marker
            key={d.deal_id}
            position={{ lat: d.lat, lng: d.lng }}
            onClick={() => onSelect?.(d.deal_id)}
            opacity={selectedId != null && d.deal_id !== selectedId ? 0.7 : 1}
          />
        ))}

        {selected && (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => onSelect?.(null)}
          >
            <div className="text-sm">
              <b>{selected.name}</b>
              <br />
              {selected.title}
              <br />
              <span className="opacity-70">
                {selected.discount_type === 'PERCENT'
                  ? `${selected.discount_value}% off`
                  : selected.discount_type === 'FIXED'
                    ? `$${selected.discount_value}`
                    : selected.discount_type}
              </span>
              <div className="opacity-70">
                {selected.start_time}–{selected.end_time}
              </div>
            </div>
          </InfoWindow>
        )}

        {userPos && (
          <Marker
            position={userPos}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: 'white',
            }}
          />
        )}
      </GoogleMap>
    </div>
  )
}
