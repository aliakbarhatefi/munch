import type { DealToday } from '../types'

export default function DealList({
  deals,
  loading,
}: {
  deals: DealToday[]
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded" />
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (!deals.length) {
    return (
      <div className="card text-sm">
        No deals found. Try zooming out, removing cuisine filters, or changing
        the city.
      </div>
    )
  }

  return (
    <ul className="card divide-y">
      {deals.map((d) => (
        <li key={d.deal_id} className="py-3">
          <div className="flex justify-between gap-2">
            <h3 className="font-semibold">
              {d.title} <span className="opacity-70">at {d.name}</span>
            </h3>
            <span className="text-sm opacity-70 shrink-0">
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
          <p className="text-xs mt-1">
            Cuisine: {d.cuisine_tags.join(', ')} · Window: {d.start_time}–
            {d.end_time}
          </p>
        </li>
      ))}
    </ul>
  )
}
