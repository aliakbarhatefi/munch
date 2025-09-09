// Deal type returned by /v1/deals/today (joined with restaurant)
export type DealToday = {
  deal_id: number
  title: string
  description: string | null
  discount_type: 'PERCENT' | 'FIXED' | 'BOGO' | 'OTHER'
  discount_value: number | null
  start_time: string
  end_time: string
  days_of_week?: number[]
  restaurant_id: number
  name: string
  address: string
  city: string
  province: string
  postal_code: string | null
  lat: number
  lng: number
  price_range: string | null
  cuisine_tags: string[]
  rating: number | null
  reviews_count: number
  pickup_only: boolean
}

/** Narrow a single deal object */
export function isDealToday(x: unknown): x is DealToday {
  if (typeof x !== 'object' || x === null) return false
  const rec = x as Record<string, unknown>
  return typeof rec.deal_id === 'number' && typeof rec.title === 'string'
}

/** Narrow an array of deals (shallow check for perf) */
export function isDealArray(x: unknown): x is DealToday[] {
  return Array.isArray(x) && (x.length === 0 || isDealToday(x[0]))
}

/** Normalize API response to an array regardless of shape ({items: []} or []). */
export function asDealsArray(x: unknown): DealToday[] {
  if (isDealArray(x)) return x
  if (typeof x === 'object' && x !== null && 'items' in x) {
    const items = (x as { items: unknown }).items
    if (isDealArray(items)) return items
  }
  return []
}
