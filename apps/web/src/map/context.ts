import { createContext, useContext } from 'react'

export type MapCtx = {
  getMap: () => google.maps.Map | null
  setMap: (m: google.maps.Map | null) => void
  panTo: (lat: number, lng: number) => void
}

export const Ctx = createContext<MapCtx | null>(null)

export function useMapCtx() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useMapCtx must be used inside <MapProvider>')
  return ctx
}
