import DealCard from './DealCard'
import type { DealToday } from '@/types'

export default function DealList({
  items,
  loading,
  error,
  onSelect,
}: {
  items: DealToday[]
  loading?: boolean
  error?: string | null
  onSelect?: (d: DealToday) => void
}) {
  if (loading) return <div className="card">Loading deals…</div>
  if (error) return <div className="card text-red-600">Error: {error}</div>
  if (!items.length)
    return (
      <div className="card text-sm opacity-70">
        No deals found. Try zooming out or clearing filters.
      </div>
    )

  return (
    <ul className="grid grid-cols-1 gap-3">
      {items.map((d) => (
        <li key={d.deal_id}>
          <DealCard d={d} onClick={() => onSelect?.(d)} />
        </li>
      ))}
    </ul>
  )
}
