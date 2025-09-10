import { useMemo, useRef } from 'react'
import { Ctx, type MapCtx } from './context'

export default function MapProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const mapRef = useRef<google.maps.Map | null>(null)

  const value = useMemo<MapCtx>(
    () => ({
      getMap: () => mapRef.current,
      setMap: (m) => {
        mapRef.current = m
      },
      panTo: (lat, lng) => {
        const m = mapRef.current
        if (!m) return
        m.panTo({ lat, lng })
        m.setZoom(Math.max(m.getZoom() ?? 12, 12))
      },
    }),
    []
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
