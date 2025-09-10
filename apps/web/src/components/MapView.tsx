import { useCallback, useMemo, useRef } from 'react'
import { GoogleMap, Marker } from '@react-google-maps/api'
import type { DealToday } from '@/types'
import { useGoogleMaps } from '@/map/google'
import { darkMapStyle } from '@/map/styles'
import { useMapCtx } from '@/map/context'

export type BBox = { south: number; west: number; north: number; east: number }

export default function MapView({
  deals,
  selectedId,
  onSelect,
  onBoundsChange,
}: {
  deals: DealToday[]
  selectedId?: number
  onSelect?: (id: number) => void
  onBoundsChange: (bbox: BBox) => void
}) {
  const mapRef = useRef<google.maps.Map | null>(null)
  const { setMap } = useMapCtx()

  // ✅ load maps via shared loader
  const { isLoaded, loadError } = useGoogleMaps()

  // Default center → use first deal or fallback (Toronto)
  const center = useMemo<[number, number]>(() => {
    if (deals.length) return [deals[0].lat, deals[0].lng]
    return [43.6532, -79.3832]
  }, [deals])

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map
      setMap(map) // share globally via context
    },
    [setMap]
  )

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

  if (loadError) {
    return (
      <div className="h-[70vh] w-full card text-red-600">
        Failed to load Google Maps.
      </div>
    )
  }
  if (!isLoaded) {
    return <div className="h-[70vh] w-full card">Loading map…</div>
  }

  return (
    <div className="h-[70vh] w-full rounded-2xl overflow-hidden shadow">
      <GoogleMap
        onLoad={onLoad}
        onIdle={handleIdle}
        center={{ lat: center[0], lng: center[1] }}
        zoom={13}
        mapContainerClassName="h-full w-full"
        options={{
          styles: darkMapStyle, // high-contrast theme
          clickableIcons: false,
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
        }}
      >
        {deals.map((d) => (
          <Marker
            key={d.deal_id}
            position={{ lat: d.lat, lng: d.lng }}
            onClick={() => onSelect?.(d.deal_id)}
            zIndex={d.deal_id === selectedId ? 999 : undefined}
            label={
              d.deal_id === selectedId
                ? { text: '★', color: 'white', fontSize: '14px' }
                : undefined
            }
          />
        ))}
      </GoogleMap>
    </div>
  )
}
