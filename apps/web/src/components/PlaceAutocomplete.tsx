import { useEffect, useRef } from 'react'
import { useGoogleMaps } from '@/map/google'

type Props = {
  placeholder?: string
  className?: string
  onPlace: (place: {
    name?: string
    address?: string
    lat: number
    lng: number
  }) => void
}

/** Minimal value shape we read from the new element */
type PACValue = {
  name?: string
  displayName?: string
  formatted_address?: string
  formattedAddress?: string
  geometry?: { location?: google.maps.LatLng }
}

type PACWrapper = { value?: PACValue }

/** Runtime type guard: does object look like the new element's wrapper (has 'value')? */
function isPACWrapper(x: unknown): x is PACWrapper {
  return (
    typeof x === 'object' &&
    x !== null &&
    'value' in (x as Record<string, unknown>)
  )
}

/** Runtime type guard: is google.maps.places.PlaceAutocompleteElement available? */
function hasPlaceAutocompleteElement(): boolean {
  const maybePlaces = (
    google.maps as unknown as { places?: Record<string, unknown> }
  ).places
  return Boolean(
    maybePlaces && typeof maybePlaces['PlaceAutocompleteElement'] === 'function'
  )
}

/** Extract a normalized payload from either new element value or legacy PlaceResult */
function normalizePlace(input: PACWrapper | google.maps.places.PlaceResult): {
  name?: string
  address?: string
  lat?: number
  lng?: number
} {
  if (isPACWrapper(input)) {
    const v = input.value
    const loc = v?.geometry?.location
    return {
      name: v?.name ?? v?.displayName,
      address: v?.formatted_address ?? v?.formattedAddress,
      lat: loc?.lat(),
      lng: loc?.lng(),
    }
  }
  const loc = input.geometry?.location
  return {
    name: input.name,
    address: input.formatted_address,
    lat: loc?.lat(),
    lng: loc?.lng(),
  }
}

export default function PlaceAutocomplete({
  placeholder = 'Search places…',
  className,
  onPlace,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const teardownRef = useRef<(() => void) | null>(null)

  const { isLoaded, loadError } = useGoogleMaps()

  useEffect(() => {
    if (!isLoaded || !hostRef.current) return

    // Run teardown from prior render
    if (teardownRef.current) {
      teardownRef.current()
      teardownRef.current = null
    }

    // Remove a legacy input if it exists and we're about to render the new element
    const removeLegacyInput = () => {
      if (inputRef.current && inputRef.current.parentNode) {
        inputRef.current.parentNode.removeChild(inputRef.current)
        inputRef.current = null
      }
    }

    // Prefer the new Web Component-like element if present
    if (hasPlaceAutocompleteElement()) {
      removeLegacyInput()

      // If you add the ambient type file below, this constructor is properly typed.
      const ctor = (
        google.maps.places as unknown as {
          PlaceAutocompleteElement: new () => HTMLElement & {
            placeholder?: string
            value?: PACValue
            addEventListener: (type: string, listener: () => void) => void
            setAttribute: (k: string, v: string) => void
          }
        }
      ).PlaceAutocompleteElement

      const el = new ctor()
      el.setAttribute('style', 'display:block;width:100%;')
      el.setAttribute('aria-label', 'Search places')
      if (placeholder) el.placeholder = placeholder

      const handle = () => {
        const normalized = normalizePlace({ value: el.value })
        if (normalized.lat !== undefined && normalized.lng !== undefined) {
          onPlace({
            name: normalized.name,
            address: normalized.address,
            lat: normalized.lat,
            lng: normalized.lng,
          })
        }
      }

      // Different channels may emit either of these; wire both
      el.addEventListener('placechange', handle)
      el.addEventListener('gmpx-placechange', handle)

      hostRef.current.appendChild(el)

      teardownRef.current = () => {
        const parent = el.parentNode
        if (parent) parent.removeChild(el)
      }

      return
    }

    // --- LEGACY FALLBACK: google.maps.places.Autocomplete on an <input> ---
    if (!inputRef.current) {
      const input = document.createElement('input')
      input.type = 'text'
      input.placeholder = placeholder
      input.className = className ?? 'px-3 py-2 rounded-xl border w-full'
      input.setAttribute('aria-label', 'Search places')
      hostRef.current.appendChild(input)
      inputRef.current = input
    }

    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ['name', 'formatted_address', 'geometry'],
      types: ['establishment', 'geocode'],
    })

    const listener = ac.addListener('place_changed', () => {
      const pr = ac.getPlace()
      const normalized = normalizePlace(pr)
      if (normalized.lat !== undefined && normalized.lng !== undefined) {
        onPlace({
          name: normalized.name,
          address: normalized.address,
          lat: normalized.lat,
          lng: normalized.lng,
        })
      }
    })

    teardownRef.current = () => {
      google.maps.event.removeListener(listener)
      // keep inputRef for subsequent renders
    }
  }, [isLoaded, className, onPlace, placeholder])

  if (loadError) {
    return (
      <input
        className={className ?? 'px-3 py-2 rounded-xl border w-full'}
        placeholder="Maps failed to load"
        disabled
      />
    )
  }

  // Host div for either new element or the legacy input
  return <div ref={hostRef} className={className} />
}
