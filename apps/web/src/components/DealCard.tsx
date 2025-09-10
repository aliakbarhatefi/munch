import type { DealToday } from '@/types'

export default function DealCard({
  d,
  onClick,
}: {
  d: DealToday
  onClick?: () => void
}) {
  const badge =
    d.discount_type === 'PERCENT'
      ? `${d.discount_value}% off`
      : d.discount_type === 'FIXED'
        ? `$${d.discount_value}`
        : d.discount_type

  return (
    <button
      onClick={onClick}
      className="w-full text-left card hover:shadow transition"
    >
      <div className="flex justify-between items-start gap-3">
        <div>
          <h3 className="font-semibold">
            {d.title} <span className="opacity-70">at {d.name}</span>
          </h3>
          <p className="text-sm opacity-80">
            {d.address}, {d.city}
          </p>
          <p className="text-xs opacity-70">
            Window: {d.start_time}–{d.end_time}
          </p>
          <p className="text-sm mt-1">Cuisine: {d.cuisine_tags.join(', ')}</p>
        </div>
        <span className="px-2 py-1 rounded-lg bg-black text-white text-xs">
          {badge}
        </span>
      </div>
    </button>
  )
}
