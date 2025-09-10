import { useMemo, useState } from 'react'
import type { Filters } from '../types'

/** Debounce with tuple-typed arguments (no `any`, fully type-safe) */
type Fn<Args extends unknown[]> = (...args: Args) => void
function debounce<Args extends unknown[]>(fn: Fn<Args>, ms = 300) {
  let t: number | undefined
  return (...args: Args) => {
    if (t) window.clearTimeout(t)
    t = window.setTimeout(() => fn(...args), ms)
  }
}

export default function FilterBar({
  initial = { city: 'Milton' },
  onChange,
  onSearchClick,
}: {
  initial?: Filters
  onChange: (f: Filters) => void
  onSearchClick?: () => void
}) {
  const [city, setCity] = useState(initial.city ?? 'Milton')
  const [cuisine, setCuisine] = useState(initial.cuisine?.join(', ') ?? '')

  const emit = useMemo(
    () =>
      debounce<[string, string]>((c, cu) => {
        const tags = cu
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        onChange({
          city: c || undefined,
          cuisine: tags.length ? tags : undefined,
        })
      }, 300),
    [onChange]
  )

  return (
    <div className="glass p-2 md:p-3 flex gap-2 items-center">
      <input
        value={city}
        onChange={(e) => {
          const v = e.target.value
          setCity(v)
          emit(v, cuisine)
        }}
        placeholder="City (e.g., Milton, Toronto)"
        className="px-3 py-2 rounded-xl border flex-1"
      />
      <input
        value={cuisine}
        onChange={(e) => {
          const v = e.target.value
          setCuisine(v)
          emit(city, v)
        }}
        placeholder="Cuisine (e.g., Pizza, Indian)"
        className="px-3 py-2 rounded-xl border flex-[2]"
      />
      <button className="btn btn-primary" onClick={onSearchClick}>
        Search
      </button>
    </div>
  )
}
