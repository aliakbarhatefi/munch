import { useEffect, useId, useState } from 'react'

export type Filters = {
  city?: string
  cuisine?: string[]
}

export default function FilterBar({
  value,
  onChange,
}: {
  value: Filters
  onChange: (f: Filters) => void
}) {
  const [city, setCity] = useState(value.city ?? '')
  const [cuisine, setCuisine] = useState((value.cuisine ?? []).join(', '))

  const cityId = useId()
  const cuisineId = useId()

  useEffect(() => {
    const arr = cuisineToArray(cuisine)
    onChange({ city: city || undefined, cuisine: arr })
  }, [city, cuisine, onChange])

  return (
    <div className="glass p-3 sticky top-2 z-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
        <label htmlFor={cityId} className="text-sm font-medium">
          City
        </label>
        <input
          id={cityId}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Milton or Toronto"
          className="px-3 py-2 rounded border md:col-span-2"
        />

        <label htmlFor={cuisineId} className="text-sm font-medium">
          Cuisine
        </label>
        <input
          id={cuisineId}
          value={cuisine}
          onChange={(e) => setCuisine(e.target.value)}
          placeholder="Pizza, Indian, Sushi"
          className="px-3 py-2 rounded border md:col-span-2"
        />
      </div>
    </div>
  )
}

function cuisineToArray(s: string): string[] | undefined {
  const arr = s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
  return arr.length ? arr : undefined
}
