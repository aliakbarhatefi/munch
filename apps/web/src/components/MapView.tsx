import { useMemo, useRef, useState } from 'react'
import {
  Map,
  AdvancedMarker,
  InfoWindow,
  MapControl,
  useMap,
  ControlPosition,
} from '@vis.gl/react-google-maps'
import type { DealToday } from '../types'
import { asDealsArray } from '../types'

type Props = { deals: unknown; loading: boolean }

/** Minimal dark style (no runtime `google` usage) */
const darkStyle = [
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
] as const

export default function MapView({ deals, loading }: Props) {
  const list = asDealsArray(deals)

  const defaultCenter = useMemo<[number, number]>(
    () => (list.length ? [list[0].lat, list[0].lng] : [43.653, -79.383]), // Toronto fallback
    [list]
  )

  const [selected, setSelected] = useState<DealToday | null>(null)
  const map = useMap() // undefined until map is ready
  const locatingRef = useRef(false)

  function locateMe(): void {
    if (!navigator.geolocation || !map || locatingRef.current) return
    locatingRef.current = true
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locatingRef.current = false
        map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        map.setZoom(14)
      },
      () => {
        locatingRef.current = false
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 10_000 }
    )
  }

  return (
    <div className="relative h-[50vh] md:h-[60vh]">
      <Map
        defaultCenter={{ lat: defaultCenter[0], lng: defaultCenter[1] }}
        defaultZoom={12}
        /* Map options as top-level props (no `options={{...}}`) */
        styles={darkStyle as unknown as google.maps.MapTypeStyle[]}
        disableDefaultUI
        gestureHandling="greedy"
        fullscreenControl={false}
        streetViewControl={false}
      >
        <MapControl position={ControlPosition.TOP_RIGHT}>
          <div className="m-3 flex gap-2">
            <button
              onClick={locateMe}
              className="px-3 py-2 rounded-xl bg-white/90 hover:bg-white shadow text-sm"
              aria-label="Locate me"
              title="Locate me"
            >
              📍 My location
            </button>
          </div>
        </MapControl>

        {list.map((d) => (
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
