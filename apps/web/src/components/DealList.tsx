import type { DealToday } from '../types'

export default function DealList({ deals }: { deals: DealToday[] }) {
  return (
    <ul className="divide-y rounded-2xl overflow-hidden shadow bg-white/90 backdrop-blur">
      {deals.map((d) => (
        <li key={d.deal_id} className="p-4">
          <div className="flex justify-between">
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
      ))}
      {deals.length === 0 && (
        <li className="p-4 text-sm opacity-70">No deals found.</li>
      )}
    </ul>
  )
}
