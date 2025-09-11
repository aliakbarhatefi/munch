import { query } from '../db'

/** JS getUTCDay() 0..6 (Sun=0) -> 1..7 (Mon=1, Sun=7) */
function toPgDowFromUTC(d: Date): number {
  const js = d.getUTCDay()
  return js === 0 ? 7 : js
}

/** "HH:MM" UTC for TIME comparisons */
function hhmmUTC(d: Date): string {
  const h = String(d.getUTCHours()).padStart(2, '0')
  const m = String(d.getUTCMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

type DealsQ = {
  city?: string
  cuisine?: string // comma-separated
  bbox?: string // south,west,north,east
  now?: string // ISO
  limit?: number
}

export async function getDealsToday(qp: DealsQ) {
  const limit = Math.min(qp.limit ?? 50, 100)
  const now = qp.now ? new Date(String(qp.now)) : new Date()
  const dow = toPgDowFromUTC(now)
  const t = hhmmUTC(now)

  const conds: string[] = [
    `d.is_active = true`,
    `($1::date is null or d.valid_from is null or d.valid_from <= $1::date)`,
    `($1::date is null or d.valid_to is null or d.valid_to >= $1::date)`,
    `$2 = ANY (d.days_of_week)`,
    `d.start_time <= $3::time and d.end_time >= $3::time`,
  ]
  const params: any[] = [now.toISOString().slice(0, 10), dow, t]

  if (qp.city) {
    params.push(qp.city)
    conds.push(`r.city = $${params.length}`)
  }

  if (qp.cuisine) {
    const tags = String(qp.cuisine)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (tags.length) {
      params.push(tags)
      conds.push(`r.cuisine_tags && $${params.length}::text[]`)
    }
  }

  if (qp.bbox) {
    const [s, w, n, e] = String(qp.bbox).split(',').map(Number)
    if ([s, w, n, e].every(Number.isFinite)) {
      params.push(s, n, w, e)
      conds.push(
        `r.lat >= $${params.length - 3} AND r.lat <= $${params.length - 2} AND r.lng >= $${params.length - 1} AND r.lng <= $${params.length}`
      )
    }
  }

  const where = `where ${conds.join(' and ')}`
  const sql = `
    select
      d.id as deal_id, d.title, d.description, d.discount_type, d.discount_value,
      d.start_time, d.end_time, d.days_of_week,
      r.id as restaurant_id, r.name, r.address, r.city, r.province, r.postal_code,
      r.lat, r.lng, r.price_range, r.cuisine_tags, r.rating, r.reviews_count, r.pickup_only
    from deal d
    join restaurant r on r.id = d.restaurant_id
    ${where}
    order by r.rating desc nulls last, r.reviews_count desc, d.start_time asc
    limit ${limit};
  `
  const { rows } = await query(sql, params)
  return rows
}
