/**
 * Shared frontend types for Munch Web.
 * Keep these in sync with API response shapes.
 */

/** ISO-8601 date/time string aliases for clarity */
export type ISODateString = string // e.g., "2025-09-08"
export type ISODateTimeString = string // e.g., "2025-09-08T17:30:00Z"

/** "HH:MM" 24h time (UTC in our current API) */
export type TimeHHMM = string // e.g., "11:00"

/** Latitude/Longitude pair */
export type LatLng = { lat: number; lng: number }

/** Map bounds: [south, west, north, east] */
export type Bounds = [south: number, west: number, north: number, east: number]

/** Price buckets shown in UI */
export type PriceRange = '$' | '$$' | '$$$'

/** Deal discount type as per DB enum-ish text */
export type DiscountType = 'PERCENT' | 'FIXED' | 'BOGO' | 'OTHER'

/** Order status placeholder (future owner flow) */
export type OrderStatus = 'PLACED' | 'READY' | 'PICKED_UP' | 'CANCELED'

/** Standard list response from API endpoints */
export type ApiList<T> = { items: T[] }

/**
 * Restaurant record (subset used by web list/map)
 * Matches SELECT in /v1/restaurants.
 */
export interface Restaurant extends LatLng {
  id: number
  name: string
  address: string
  city: string
  province: string
  postal_code: string | null
  price_range: PriceRange | null
  cuisine_tags: string[]
  rating: number | null
  reviews_count: number
  pickup_only: boolean
}

/**
 * Deal record (base table shape)
 */
export interface Deal {
  id: number
  restaurant_id: number
  title: string
  description: string | null
  discount_type: DiscountType
  discount_value: number | null // null for BOGO/OTHER
  start_time: TimeHHMM
  end_time: TimeHHMM
  days_of_week: number[] // 1..7 (Mon..Sun)
  valid_from: ISODateString | null
  valid_to: ISODateString | null
  is_active: boolean
}

/**
 * Joined shape returned by /v1/deals/today
 * Includes deal fields + essential restaurant fields for map/list.
 */
export interface DealToday extends LatLng {
  // Deal fields
  deal_id: number
  title: string
  description: string | null
  discount_type: DiscountType
  discount_value: number | null
  start_time: TimeHHMM
  end_time: TimeHHMM
  days_of_week: number[]

  // Restaurant fields
  restaurant_id: number
  name: string
  address: string
  city: string
  province: string
  postal_code: string | null
  price_range: PriceRange | null
  cuisine_tags: string[]
  rating: number | null
  reviews_count: number
  pickup_only: boolean
}

/**
 * UI filter model used by FilterBar/App.
 * - Only include fields you actually use in querystrings.
 */
export type UiFilters = {
  city?: string // e.g., "Milton"
  cuisine?: string[] // e.g., ["Pizza","Indian"]
  bbox?: Bounds // optional, when map selection drives queries
  now?: ISODateTimeString // defaults to client now if omitted
  limit?: number // guard at <= 100 in API
}
