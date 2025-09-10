import { useEffect, useState } from 'react'

export type Filters = {
  city?: string
  cuisine?: string[]
  price?: '' | '$' | '$$' | '$$$'
  openNow?: boolean
}

export default function FilterBar({
  value,
  onChange,
}: {
  value: Filters
  onChange: (v: Filters) => void
}) {
  const [local, setLocal] = useState<Filters>(value)

  useEffect(() => setLocal(value), [value])

  // Debounce updates to avoid spamming the API
  useEffect(() => {
    const t = setTimeout(() => onChange(local), 300)
    return () => clearTimeout(t)
  }, [local, onChange])

  return (
    <form className="mx-auto max-w-6xl px-4 py-2 flex flex-wrap gap-2 items-center">
      <label className="text-sm text-slate-600">
        <span className="sr-only">City</span>
        <input
          className="px-3 py-2 rounded-xl border"
          placeholder="City"
          value={local.city ?? ''}
          onChange={(e) => setLocal((v) => ({ ...v, city: e.target.value }))}
        />
      </label>

      <label className="text-sm text-slate-600">
        <span className="sr-only">Cuisine</span>
        <input
          className="px-3 py-2 rounded-xl border min-w-[220px]"
          placeholder="Cuisine (comma separated)"
          onChange={(e) =>
            setLocal((v) => ({
              ...v,
              cuisine: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            }))
          }
        />
      </label>

      <select
        className="px-3 py-2 rounded-xl border"
        value={local.price ?? ''}
        onChange={(e) =>
          setLocal((v) => ({ ...v, price: e.target.value as Filters['price'] }))
        }
        aria-label="Price"
      >
        <option value="">Any price</option>
        <option value="$">$</option>
        <option value="$$">$$</option>
        <option value="$$$">$$$</option>
      </select>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!local.openNow}
          onChange={(e) =>
            setLocal((v) => ({ ...v, openNow: e.target.checked }))
          }
        />
        Open now
      </label>

      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setLocal({})}
      >
        Clear
      </button>
    </form>
  )
}
