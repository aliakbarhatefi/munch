import { Loader } from '@googlemaps/js-api-loader'
import { useEffect, useRef } from 'react'
import type { BBox, DealToday } from '../types'

type Props = {
  deals: DealToday[]
  onBoundsChange: (bbox: BBox) => void
  onMapReady?: (map: google.maps.Map) => void
}

export default function MapView({ deals, onBoundsChange, onMapReady }: Props) {
  const divRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const idleListenerRef = useRef<google.maps.MapsEventListener | null>(null)

  // init map once, via loader
  useEffect(() => {
    if (!divRef.current || mapRef.current) return

    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
      version: 'weekly', // verify in environment
    })

    loader.load().then(() => {
      const g = google
      mapRef.current = new g.maps.Map(divRef.current!, {
        center: { lat: 43.6532, lng: -79.3832 }, // Toronto
        zoom: 12,
        // mapId: 'YOUR_MAP_ID'
      })

      idleListenerRef.current = mapRef.current.addListener('idle', () => {
        const b = mapRef.current!.getBounds()
        if (!b) return
        const ne = b.getNorthEast()
        const sw = b.getSouthWest()
        onBoundsChange({
          south: sw.lat(),
          west: sw.lng(),
          north: ne.lat(),
          east: ne.lng(),
        })
      })

      onMapReady?.(mapRef.current)
    })

    return () => {
      if (idleListenerRef.current) {
        idleListenerRef.current.remove()
        idleListenerRef.current = null
      }
    }
  }, [onBoundsChange, onMapReady])

  // render markers whenever deals change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // clear old markers
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    deals.forEach((d) => {
      const marker = new google.maps.Marker({
        position: { lat: d.lat, lng: d.lng },
        map,
        title: `${d.name} — ${d.title}`,
      })

      const content = `
        <div style="max-width:220px">
          <b>${d.name}</b><br/>
          ${d.title}<br/>
          ${
            d.discount_type === 'PERCENT'
              ? `${d.discount_value}% off`
              : d.discount_type === 'FIXED'
                ? `$${d.discount_value}`
                : d.discount_type
          }<br/>
          <small>${d.start_time}–${d.end_time}</small>
        </div>
      `
      const info = new google.maps.InfoWindow({ content })
      marker.addListener('click', () => info.open({ map, anchor: marker }))

      markersRef.current.push(marker)
    })
  }, [deals])

  return (
    <div
      ref={divRef}
      className="h-[65vh] w-full rounded-2xl overflow-hidden shadow"
    />
  )
}
