// src/map/useMapApi.ts
import { useContext } from 'react'
import { MapApiContext } from './context'

export function useMapApi() {
  return useContext(MapApiContext)
}
