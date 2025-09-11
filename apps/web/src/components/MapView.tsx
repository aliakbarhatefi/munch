import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import { useCallback, useMemo, useRef } from 'react'
import type { DealToday } from '../types'

export type BBox = { south: number; west: number; north: number; east: number }

type Props = {
  deals: DealToday[]
  onBoundsChange: (bbox: BBox) => void
  selectedId?: number
  onSelect?: (id: number) => void
}

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  clickableIcons: false,
  gestureHandling: 'greedy',
}

export default function MapView({
  deals,
  onBoundsChange,
  selectedId,
  onSelect,
}: Props) {
  const center = useMemo<google.maps.LatLngLiteral>(() => {
    if (deals.length) return { lat: deals[0].lat, lng: deals[0].lng }
    return { lat: 43.65, lng: -79.38 } // Toronto fallback
  }, [deals])

  const { isLoaded } = useJsApiLoader({
    id: 'gmaps',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries: ['places'],
  })

  const mapRef = useRef<google.maps.Map | null>(null)

  const handleLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  const handleUnmount = useCallback(() => {
    mapRef.current = null
  }, [])

  const handleIdle = useCallback(() => {
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

  if (!isLoaded) return <div className="h-[65vh] w-full card">Loading map…</div>

  return (
    <div className="h-[65vh] w-full rounded-2xl overflow-hidden shadow">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={13}
        options={mapOptions}
        onLoad={handleLoad}
        onUnmount={handleUnmount}
        onIdle={handleIdle}
      >
        {deals.map((d) => (
          <Marker
            key={d.deal_id}
            position={{ lat: d.lat, lng: d.lng }}
            onClick={() => onSelect?.(d.deal_id)}
            icon={
              selectedId === d.deal_id
                ? {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: '#ff0000',
                    fillOpacity: 1,
                    strokeWeight: 2,
                    strokeColor: '#ffffff',
                  }
                : undefined
            }
          />
        ))}
      </GoogleMap>
    </div>
  )
}
