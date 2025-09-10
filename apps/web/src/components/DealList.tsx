import type { DealToday } from '../types'

export default function DealList({
  deals,
  loading,
  error,
  selectedId,
  onSelect,
}: {
  deals: DealToday[]
  loading: boolean
  error: string | null
  selectedId?: number | null
  onSelect?: (id: number) => void
}) {
  if (loading) return <div className="card">Loading deals…</div>
  if (error) return <div className="card text-red-600">Error: {error}</div>
  if (!deals.length) {
    return (
      <div className="card text-sm opacity-70">
        No deals found. Try zooming out, removing cuisine filters, or moving the
        map.
      </div>
    )
  }

  return (
    <ul className="rounded-2xl overflow-hidden border bg-white/90 backdrop-blur divide-y">
      {deals.map((d) => {
        const active = selectedId === d.deal_id
        return (
          <li
            key={d.deal_id}
            onClick={() => onSelect?.(d.deal_id)}
            className={`p-4 cursor-pointer transition-colors ${active ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
          >
            <div className="flex justify-between gap-3">
              <h3 className="font-semibold">
                {d.title} <span className="opacity-70">at {d.name}</span>
              </h3>
              <span className="text-sm opacity-70">
                {d.discount_type === 'PERCENT'
                  ? `${d.discount_value}%`
                  : d.discount_type === 'FIXED'
                    ? `$${d.discount_value}`
                    : d.discount_type}
              </span>
            </div>
            <p className="text-sm opacity-80">
              {d.address}, {d.city}
            </p>
            <p className="text-sm mt-1">Cuisine: {d.cuisine_tags.join(', ')}</p>
            <p className="text-xs opacity-70">
              Window: {d.start_time}–{d.end_time}
            </p>
          </li>
        )
      })}
    </ul>
  )
}
