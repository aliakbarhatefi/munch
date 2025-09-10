// src/map/context.ts
import { createContext } from 'react'

export type MapApiContextValue = {
  isLoaded: boolean
  loadError?: Error
}

export const MapApiContext = createContext<MapApiContextValue>({
  isLoaded: false,
})
