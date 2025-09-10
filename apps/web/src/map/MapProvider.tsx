import type { ReactNode } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'
import type { Library } from '@googlemaps/js-api-loader'
import { MapApiContext } from './context'

const GOOGLE_LIBRARIES: Library[] = ['places']

export function MapProvider({ children }: { children: ReactNode }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_LIBRARIES,
  })
  return (
    <MapApiContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </MapApiContext.Provider>
  )
}
