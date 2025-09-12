import { query } from '../db.js'

export type DealsQuery = {
  city?: string
  limit?: string | number
}

// Keep your existing SQL/filters if you already have them.
// This is a safe skeleton that respects city + limit.
export async function getDealsToday(q: DealsQuery) {
  const city = q.city ?? null
  const limit = Number.isFinite(Number(q.limit)) ? Number(q.limit) : 50

  const { rows } = await query(
    `
    SELECT
      d.id,
      d.restaurant_id,
      r.name AS restaurant_name,
      d.title,
      d.description,
      d.discount_pct,
      d.starts_at_utc,
      d.ends_at_utc,
      r.lat,
      r.lng,
      r.city
    FROM deal_today_view d
    JOIN restaurant r ON r.id = d.restaurant_id
    WHERE ($1::text IS NULL OR lower(r.city) = lower($1))
    ORDER BY d.ends_at_utc ASC
    LIMIT $2
    `,
    [city, limit]
  )

  return rows
}
