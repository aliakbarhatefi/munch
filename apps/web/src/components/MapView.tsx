import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Map,
  AdvancedMarker,
  InfoWindow,
  MapControl,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps'
import type { DealToday } from '../types'

export type BBox = [south: number, west: number, north: number, east: number]

// Minimal dark-ish style
const darkStyle: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1f2937' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#374151' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0ea5e9' }],
  },
]

export default function MapView({
  deals,
  loading,
  onBoundsChange,
}: {
  deals: DealToday[]
  loading: boolean
  onBoundsChange?: (bbox: BBox) => void
}) {
  const defaultCenter = useMemo<[number, number]>(() => {
    if (deals.length) return [deals[0].lat, deals[0].lng]
    return [43.653, -79.383] // Toronto
  }, [deals])

  const [selected, setSelected] = useState<DealToday | null>(null)

  return (
    <div className="relative h-[50vh] md:h-[60vh]">
      <Map
        id="main-map"
        defaultCenter={{ lat: defaultCenter[0], lng: defaultCenter[1] }}
        defaultZoom={12}
        gestureHandling="greedy"
        fullscreenControl={false}
        streetViewControl={false}
        styles={darkStyle}
        disableDefaultUI
      >
        <Controls onBoundsChange={onBoundsChange} />
        {deals.map((d) => (
          <AdvancedMarker
            key={d.deal_id}
            position={{ lat: d.lat, lng: d.lng }}
            onClick={() => setSelected(d)}
          >
            <div className="rounded-full px-2 py-1 text-xs bg-white shadow border">
              {badgeText(d)}
            </div>
          </AdvancedMarker>
        ))}

        {selected && (
          <InfoWindow
            position={{ lat: selected.lat, lng: selected.lng }}
            onCloseClick={() => setSelected(null)}
          >
            <div className="p-1">
              <div className="font-semibold">{selected.name}</div>
              <div className="text-sm">{selected.title}</div>
              <div className="text-xs opacity-70">
                {selected.start_time}–{selected.end_time} •{' '}
                {selected.cuisine_tags.join(', ')}
              </div>
            </div>
          </InfoWindow>
        )}
      </Map>

      {loading && (
        <div className="absolute inset-0 grid place-items-center bg-white/40 backdrop-blur-sm">
          <div className="animate-pulse text-sm">Loading deals…</div>
        </div>
      )}
    </div>
  )
}

function badgeText(d: DealToday) {
  if (d.discount_type === 'PERCENT') return `${d.discount_value}%`
  if (d.discount_type === 'FIXED') return `$${d.discount_value}`
  return d.discount_type
}

/**
 * A child component that safely uses hooks to:
 * - attach Places Autocomplete to an input
 * - emit bbox via onBoundsChange on 'idle'
 * - provide a "Locate me" button
 */
function Controls({
  onBoundsChange,
}: {
  onBoundsChange?: (bbox: BBox) => void
}) {
  const map = useMap('main-map')
  const places = useMapsLibrary('places')
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Places Autocomplete
  useEffect(() => {
    if (!places || !inputRef.current || !map) return
    const ac = new places.Autocomplete(inputRef.current, {
      fields: ['geometry', 'name', 'formatted_address'],
    })
    const listener = ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      const loc = place?.geometry?.location
      if (loc) {
        map.panTo(loc)
        map.setZoom(14)
      }
    })
    return () => listener.remove()
  }, [places, map])

  // Emit bbox to parent on map idle (pan/zoom end)
  useEffect(() => {
    if (!map || !onBoundsChange) return
    const idleListener = map.addListener('idle', () => {
      const b = map.getBounds()
      if (!b) return
      const ne = b.getNorthEast()
      const sw = b.getSouthWest()
      onBoundsChange([sw.lat(), sw.lng(), ne.lat(), ne.lng()])
    })
    return () => idleListener.remove()
  }, [map, onBoundsChange])

  function locateMe() {
    if (!map || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords
      map.panTo({ lat: latitude, lng: longitude })
      map.setZoom(14)
    })
  }

  return (
    <MapControl position={google.maps.ControlPosition.TOP_LEFT}>
      <div className="m-3 flex gap-2">
        <input
          ref={inputRef}
          placeholder="Search places…"
          className="px-3 py-2 rounded-xl bg-white/95 shadow border text-sm w-64"
          aria-label="Search places"
        />
        <button
          onClick={locateMe}
          className="px-3 py-2 rounded-xl bg-white/95 hover:bg-white shadow text-sm"
          aria-label="Locate me"
          title="Locate me"
        >
          📍
        </button>
      </div>
    </MapControl>
  )
}
