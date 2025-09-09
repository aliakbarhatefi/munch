import { useState } from 'react'

export type Filters = { city?: string; cuisine?: string[] }

export default function FilterBar({
  onChange,
}: {
  onChange: (f: Filters) => void
}) {
  const [city, setCity] = useState('Milton')
  const [cuisine, setCuisine] = useState('')

  function apply(next?: Partial<Filters>) {
    const cuisineArr =
      (next?.cuisine as string[] | undefined) ??
      cuisine
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    onChange({
      city: next?.city ?? city,
      cuisine: cuisineArr.length ? cuisineArr : undefined,
    })
  }

  return (
    <div className="glass flex flex-col md:flex-row gap-2 items-stretch md:items-center p-3">
      <input
        value={city}
        onChange={(e) => {
          setCity(e.target.value)
          apply({ city: e.target.value })
        }}
        placeholder="City (Milton / Toronto)"
        className="px-3 py-2 rounded-xl border bg-white/80 focus:outline-none focus:ring focus:ring-slate-300"
      />
      <input
        value={cuisine}
        onChange={(e) => {
          setCuisine(e.target.value)
          apply({ cuisine: e.target.value.split(',').map((s) => s.trim()) })
        }}
        placeholder="Cuisine (e.g., Pizza, Indian)"
        className="px-3 py-2 rounded-xl border bg-white/80 flex-1 focus:outline-none focus:ring focus:ring-slate-300"
      />
      <button
        className="btn btn-primary"
        onClick={() => apply()}
        aria-label="Search"
        title="Search"
      >
        Search
      </button>
    </div>
  )
}
