import { useEffect, useMemo, useRef, useState } from 'react'

export type Filters = {
  city?: string
  cuisine?: string[] // e.g. ['Pizza','Indian']
  price?: '$' | '$$' | '$$$' // optional
  timeISO?: string // if not provided, caller can use new Date().toISOString()
  minRating?: number // 0..5
  // Optional: if you use geolocation outside, you can pass coords up/down the tree
  lat?: number
  lng?: number
}

type Props = {
  initial?: Partial<Filters>
  onChange: (f: Filters) => void
  className?: string
  /** If provided, called when user taps 'Use my location'. Parent can start geolocation & update filters. */
  onLocateMe?: () => void
}

const PRICE_OPTIONS: Array<Filters['price']> = ['$', '$$', '$$$']

export default function FilterBar({
  initial,
  onChange,
  className,
  onLocateMe,
}: Props) {
  // ----- state
  const [city, setCity] = useState(initial?.city ?? 'Milton')
  const [cuisineInput, setCuisineInput] = useState('')
  const [cuisineTags, setCuisineTags] = useState<string[]>(
    initial?.cuisine ?? []
  )
  const [price, setPrice] = useState<Filters['price']>(initial?.price)
  const [useCustomTime, setUseCustomTime] = useState<boolean>(false)
  const [time, setTime] = useState<string>('') // "HH:MM" 24h
  const [minRating, setMinRating] = useState<number>(initial?.minRating ?? 0)

  // ----- derived ISO time (UTC) if custom time enabled
  const timeISO = useMemo(() => {
    if (!useCustomTime || !time) return undefined
    // Combine today's date (local) + HH:MM (local) and convert to ISO
    const now = new Date()
    const [hh, mm] = time.split(':').map(Number)
    if (Number.isFinite(hh) && Number.isFinite(mm)) {
      const d = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hh,
        mm,
        0,
        0
      )
      return d.toISOString()
    }
    return undefined
  }, [useCustomTime, time])

  // ----- debounce notify
  const debounced = useDebouncedCallback(() => {
    onChange({
      city: normalizeCity(city),
      cuisine: cuisineTags.length ? cuisineTags : undefined,
      price,
      timeISO,
      minRating: clamp(minRating, 0, 5),
    })
  }, 250)

  useEffect(() => {
    debounced()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, cuisineTags, price, timeISO, minRating])

  // ----- handlers
  function addCuisineFromInput() {
    const parts = cuisineInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (!parts.length) return
    const set = new Set([...cuisineTags, ...parts.map(capitalize)])
    setCuisineTags(Array.from(set))
    setCuisineInput('')
  }

  function removeCuisine(tag: string) {
    setCuisineTags((arr) => arr.filter((t) => t !== tag))
  }

  function clearAll() {
    setCity('Milton')
    setCuisineTags([])
    setCuisineInput('')
    setPrice(undefined)
    setUseCustomTime(false)
    setTime('')
    setMinRating(0)
  }

  return (
    <div
      className={
        className ??
        'w-full rounded-2xl bg-white/70 backdrop-blur shadow-sm border p-3 md:p-4'
      }
      role="region"
      aria-label="Filters"
    >
      <div className="flex flex-col gap-3 md:gap-4">
        {/* Row 1: City + Cuisine */}
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Milton or Toronto"
              className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring"
              aria-label="City"
            />
          </div>

          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">Cuisine</label>
            <div className="flex gap-2">
              <input
                value={cuisineInput}
                onChange={(e) => setCuisineInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCuisineFromInput()
                  }
                }}
                placeholder="Pizza, Indian, Sushi…"
                className="w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring"
                aria-label="Cuisine input"
              />
              <button
                onClick={addCuisineFromInput}
                className="px-3 py-2 rounded-xl bg-black text-white hover:opacity-90"
                aria-label="Add cuisine"
                title="Add cuisine"
              >
                Add
              </button>
            </div>
            {cuisineTags.length > 0 && (
              <ul
                className="mt-2 flex flex-wrap gap-2"
                aria-label="Selected cuisines"
              >
                {cuisineTags.map((tag) => (
                  <li key={tag}>
                    <button
                      onClick={() => removeCuisine(tag)}
                      className="group text-sm px-2 py-1 rounded-full border bg-white hover:bg-slate-50"
                      aria-label={`Remove ${tag}`}
                      title={`Remove ${tag}`}
                    >
                      {tag}
                      <span className="ml-1 opacity-60 group-hover:opacity-100">
                        ×
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Row 2: Price + Time + Rating */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium mb-1">Price</label>
            <div className="flex gap-2">
              {PRICE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setPrice((p) => (p === opt ? undefined : opt))}
                  className={
                    'px-3 py-2 rounded-xl border min-w-[3rem] ' +
                    (price === opt
                      ? 'bg-black text-white'
                      : 'bg-white hover:bg-slate-50')
                  }
                  aria-pressed={price === opt}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Time</label>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={useCustomTime}
                  onChange={(e) => setUseCustomTime(e.target.checked)}
                  aria-label="Use custom time"
                />
                Custom
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={!useCustomTime}
                className="px-3 py-2 rounded-xl border disabled:opacity-50"
                aria-label="Custom time"
              />
            </div>
            <p className="text-xs opacity-60 mt-1">
              If disabled, backend should use current time.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Min rating</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="w-full"
                aria-label="Minimum rating"
              />
              <span className="text-sm w-10 text-right">
                {minRating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Row 3: actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              onClick={clearAll}
              className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50"
            >
              Clear
            </button>

            {onLocateMe && (
              <button
                onClick={onLocateMe}
                className="px-3 py-2 rounded-xl bg-white border hover:bg-slate-50"
                aria-label="Use my location"
                title="Use my location"
              >
                📍 Use my location
              </button>
            )}
          </div>

          {/* Optional explicit apply (debounce already fires on change).
              Keep if you want a click-to-apply pattern later.
          */}
          <span className="text-xs opacity-60">
            Filters auto-apply. Press Enter in fields to add cuisines quickly.
          </span>
        </div>
      </div>
    </div>
  )
}

/* ---------------- helpers ---------------- */

function useDebouncedCallback(fn: () => void, delay = 250) {
  const t = useRef<number | null>(null)
  useEffect(
    () => () => {
      if (t.current) window.clearTimeout(t.current)
    },
    []
  )
  return () => {
    if (t.current) window.clearTimeout(t.current)
    t.current = window.setTimeout(fn, delay)
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function normalizeCity(s?: string) {
  const x = (s ?? '').trim()
  if (!x) return undefined
  // Title-case simple names: 'toronto' -> 'Toronto'
  return x.charAt(0).toUpperCase() + x.slice(1)
}

function capitalize(s: string) {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}
