/**
 * GET /v1/deals/today
 * Query:
 *  - city?: string                 // case-insensitive prefix: "Milton" matches "Milton, ON"
 *  - bbox?: string                 // "south,west,north,east"
 *  - cuisine?: string              // "Pizza,Indian"
 *  - minRating?: number            // 0..5
 *  - price?: '$' | '$$' | '$$$'
 *  - limit?: number                // default 50, max 100
 *  - now?: ISO string              // defaults to current time
 *  - debug_ignore_time?: 'true'    // skip weekday/time filters
 *
 * Time zone used in SQL: America/Toronto
 */

import { FastifyInstance } from 'fastify'
import { getPool } from '../db.js'

type QP = {
  city?: string
  bbox?: string
  cuisine?: string // "Pizza,Indian"
  minRating?: string // parseFloat later
  price?: '$' | '$$' | '$$$'
  limit?: string
  now?: string
  debug_ignore_time?: 'true' | 'false' | string
}

function parseBBox(bbox?: string): [number, number, number, number] | null {
  if (!bbox) return null
  const parts = bbox.split(',').map((n) => Number(n.trim()))
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return null
  const [south, west, north, east] = parts
  if (!(south < north) || !(west < east)) return null
  return [south, west, north, east]
}

export default async function dealsToday(app: FastifyInstance) {
  const pool = getPool()

  app.get('/v1/deals/today', async (req, reply) => {
    const qp = req.query as QP

    // ---------- params / defaults ----------
    const limit = Math.min(
      Math.max(parseInt(qp.limit ?? '50', 10) || 50, 1),
      100
    )
    const nowIso = qp.now ?? new Date().toISOString()
    const ignoreTime = qp.debug_ignore_time === 'true'

    const cuisineTags = (qp.cuisine ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const minRating = Number.isFinite(parseFloat(qp.minRating ?? ''))
      ? Math.max(0, Math.min(5, parseFloat(qp.minRating!)))
      : undefined

    const bbox = parseBBox(qp.bbox)

    // ---------- dynamic SQL ----------
    // compute local day/time ON THE DB using AT TIME ZONE 'America/Toronto'
    // - local_dow: 1..7 (Mon..Sun)
    // - local_time: TIME in local tz
    const conds: string[] = [
      `d.is_active = true`,
      `(d.valid_from is null or d.valid_from <= ( ( $1::timestamptz ) at time zone 'America/Toronto')::date)`,
      `(d.valid_to   is null or d.valid_to   >= ( ( $1::timestamptz ) at time zone 'America/Toronto')::date)`,
    ]
    const params: unknown[] = [nowIso]

    if (!ignoreTime) {
      conds.push(`
        (
          extract(isodow from ( $1::timestamptz ) at time zone 'America/Toronto')::int = ANY(d.days_of_week)
          AND d.start_time <= ( ( $1::timestamptz ) at time zone 'America/Toronto')::time
          AND d.end_time   >= ( ( $1::timestamptz ) at time zone 'America/Toronto')::time
        )
      `)
    }

    // City prefix, tolerant & case-insensitive
    if (qp.city && qp.city.trim()) {
      params.push(`${qp.city.trim()}%`)
      conds.push(`lower(r.city) LIKE lower($${params.length})`)
    }

    // Cuisine tags (array overlap)
    if (cuisineTags.length) {
      params.push(cuisineTags)
      conds.push(`r.cuisine_tags && $${params.length}::text[]`)
    }

    if (qp.price && ['$', '$$', '$$$'].includes(qp.price)) {
      params.push(qp.price)
      conds.push(`r.price_range = $${params.length}`)
    }

    if (typeof minRating === 'number') {
      params.push(minRating)
      conds.push(`(r.rating is not null AND r.rating >= $${params.length})`)
    }

    if (bbox) {
      const [south, west, north, east] = bbox
      params.push(south, north, west, east)
      conds.push(
        `r.lat BETWEEN $${params.length - 3} AND $${params.length - 2}`
      )
      conds.push(`r.lng BETWEEN $${params.length - 1} AND $${params.length}`)
    }

    const sql = `
      SELECT
        d.id            AS deal_id,
        d.title,
        d.description,
        d.discount_type,
        d.discount_value,
        d.start_time,
        d.end_time,
        d.days_of_week,
        r.id            AS restaurant_id,
        r.name,
        r.city,
        r.address,
        r.lat,
        r.lng,
        r.cuisine_tags,
        r.price_range,
        r.rating,
        r.reviews_count,
        r.pickup_only
      FROM deal d
      JOIN restaurant r ON r.id = d.restaurant_id
      WHERE ${conds.join(' AND ')}
      ORDER BY r.rating DESC NULLS LAST, r.reviews_count DESC, d.start_time ASC
      LIMIT ${limit};
    `

    try {
      const { rows } = await pool.query(sql, params)
      return { items: rows }
    } catch (err) {
      req.log.error({ err }, 'deals/today failed')
      return reply
        .status(500)
        .send({ error: 'DB_ERROR', message: (err as Error).message })
    }
  })
}
