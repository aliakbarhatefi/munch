import { useId } from 'react'
import type { Filters } from '../types'

export default function FilterBar({
  value,
  onChange,
}: {
  value: Filters
  onChange: (next: Filters) => void
}) {
  const cityId = useId()
  const cuisineId = useId()

  const cuisineStr = (value.cuisine ?? []).join(', ')

  return (
    <div className="glass p-3 flex gap-3 items-end flex-wrap">
      <div className="flex-1 min-w-[220px]">
        <label
          htmlFor={cityId}
          className="block text-xs font-medium text-slate-600 mb-1"
        >
          City
        </label>
        <input
          id={cityId}
          value={value.city ?? ''}
          onChange={(e) =>
            onChange({ ...value, city: e.target.value || undefined })
          }
          placeholder="Milton or Toronto"
          className="w-full px-3 py-2 rounded-xl border border-slate-300"
        />
      </div>

      <div className="flex-1 min-w-[260px]">
        <label
          htmlFor={cuisineId}
          className="block text-xs font-medium text-slate-600 mb-1"
        >
          Cuisine (comma separated)
        </label>
        <input
          id={cuisineId}
          value={cuisineStr}
          onChange={(e) => {
            const arr = e.target.value
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
            onChange({ ...value, cuisine: arr.length ? arr : undefined })
          }}
          placeholder="Pizza, Indian, Wings"
          className="w-full px-3 py-2 rounded-xl border border-slate-300"
        />
      </div>
    </div>
  )
}
