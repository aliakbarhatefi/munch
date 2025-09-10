// Centralized Google Maps loader so the script is added only once.
import { Libraries, useJsApiLoader } from '@react-google-maps/api'

// Keep as a stable constant (prevents the "reloaded unintentionally" warning)
export const GOOGLE_LIBRARIES: Libraries = ['places']

export function useGoogleMaps() {
  return useJsApiLoader({
    id: 'google-map-script', // ensures the same <script> tag is reused
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: GOOGLE_LIBRARIES,
  })
}
