// Ambient typing for the new Google Places Autocomplete Element.
// Loaded via the Maps JS API "places" library.
declare namespace google.maps.places {
  interface PlaceAutocompleteElement extends HTMLElement {
    placeholder?: string
    value?: {
      name?: string
      displayName?: string
      formatted_address?: string
      formattedAddress?: string
      geometry?: { location?: google.maps.LatLng }
    }
    addEventListener(
      type: 'placechange' | 'gmpx-placechange',
      listener: () => void
    ): void
  }

  // Constructor present when the element is available
  const PlaceAutocompleteElement: {
    new (): PlaceAutocompleteElement
  }
}
