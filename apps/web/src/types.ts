export type DealToday = {
  deal_id: number
  title: string
  description: string | null
  discount_type: 'PERCENT' | 'FIXED' | 'BOGO' | 'OTHER'
  discount_value: number | null
  start_time: string // "HH:MM"
  end_time: string // "HH:MM"

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

export type Filters = {
  city?: string
  cuisine?: string[]
}

export type BBox = { south: number; west: number; north: number; east: number }
