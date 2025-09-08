import { useState } from 'react'

export type Filters = {
  city?: string
  cuisine?: string[]
}

export default function FilterBar({
  onChange,
}: {
  onChange: (f: Filters) => void
}) {
  const [city, setCity] = useState('Milton')
  const [cuisine, setCuisine] = useState('')

  return (
    <div className="flex gap-2 items-center p-3 bg-white/80 backdrop-blur rounded-xl shadow">
      <input
        value={city}
        onChange={(e) => {
          setCity(e.target.value)
          onChange({ city: e.target.value, cuisine: cuisineToArray(cuisine) })
        }}
        placeholder="City (Milton/Toronto)"
        className="px-3 py-2 rounded border"
      />
      <input
        value={cuisine}
        onChange={(e) => {
          setCuisine(e.target.value)
          onChange({ city, cuisine: cuisineToArray(e.target.value) })
        }}
        placeholder="Cuisine tags (comma separated)"
        className="px-3 py-2 rounded border flex-1"
      />
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
