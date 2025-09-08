// apps/web/src/components/MapView.tsx
import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import type { DealToday } from '../types'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// ✅ Fix Leaflet’s default icon paths (Vite bundler quirk)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x as string,
  iconUrl: markerIcon as string,
  shadowUrl: markerShadow as string,
})

interface MapViewProps {
  deals: DealToday[]
  initialCenter?: [number, number]
  initialZoom?: number
}

export default function MapView({
  deals,
  initialCenter = [43.65, -79.38], // Toronto fallback
  initialZoom = 13,
}: MapViewProps) {
  // Center on first deal if present, else fallback
  const center: [number, number] = useMemo(() => {
    return deals.length > 0 ? [deals[0].lat, deals[0].lng] : initialCenter
  }, [deals, initialCenter])

  return (
    <div className="h-[60vh] w-full rounded-2xl overflow-hidden shadow">
      <MapContainer
        center={center}
        zoom={initialZoom}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {deals.map((d) => (
          <Marker key={d.deal_id} position={[d.lat, d.lng]}>
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{d.name}</div>
                <div className="text-sm">{d.title}</div>
                <div className="text-sm opacity-80">
                  {d.discount_type === 'PERCENT'
                    ? `${d.discount_value}% off`
                    : d.discount_type === 'FIXED'
                      ? `$${d.discount_value}`
                      : d.discount_type}
                </div>
                <div className="text-xs opacity-70">
                  {d.address}, {d.city}
                </div>
                <div className="text-xs opacity-70">
                  Window: {d.start_time}–{d.end_time}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
