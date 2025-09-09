import { useEffect, useRef } from 'react'

/** Minimal typings for the Places web component + event */
type PlaceSelectEvent = Event & {
  detail?: { place?: google.maps.places.PlaceResult }
}

interface GmpPlaceAutocompleteElement extends HTMLElement {
  /** Optional current value (not always exposed) */
  value?: string
  /** Standard DOM API (already on HTMLElement) */
  setAttribute(name: string, value: string): void
  addEventListener(
    type: 'gmp-placeselect',
    listener: (ev: PlaceSelectEvent) => void,
    options?: boolean | AddEventListenerOptions
  ): void
  removeEventListener(
    type: 'gmp-placeselect',
    listener: (ev: PlaceSelectEvent) => void,
    options?: boolean | EventListenerOptions
  ): void
}

type GmpPlaceAutocompleteElementConstructor =
  new () => GmpPlaceAutocompleteElement

export default function PlaceAutocomplete({
  placeholder = 'Search places…',
  onSelect,
  className,
}: {
  placeholder?: string
  onSelect: (place: google.maps.places.PlaceResult) => void
  className?: string
}) {
  const holderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Pull a typed google namespace from globalThis without using `any`
    type GoogleNS = typeof google
    const g = (globalThis as { google?: GoogleNS }).google
    const holder = holderRef.current

    if (!holder || !g?.maps?.places) return

    // Get the constructor in a type-safe way (avoid `any`)
    const Ctor = (
      g.maps.places as unknown as {
        PlaceAutocompleteElement?: GmpPlaceAutocompleteElementConstructor
      }
    ).PlaceAutocompleteElement

    if (!Ctor) return

    const el = new Ctor()
    el.setAttribute('placeholder', placeholder)

    const handlePlace = (ev: PlaceSelectEvent) => {
      const place = ev.detail?.place
      if (place) onSelect(place)
    }

    // Mount element
    holder.innerHTML = ''
    holder.appendChild(el)

    // Listen for selection
    el.addEventListener('gmp-placeselect', handlePlace)

    // Cleanup: use captured references (holder, el)
    return () => {
      el.removeEventListener('gmp-placeselect', handlePlace)
      if (holder.contains(el)) holder.removeChild(el)
    }
  }, [onSelect, placeholder])

  return <div ref={holderRef} className={className} />
}
