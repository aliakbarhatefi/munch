/**
 * GET /v1/deals/today
 * Query params:
 *  - city?: string                 (matches case-insensitively, prefix OK e.g. "Milton" matches "Milton, ON")
 *  - bbox?: string                 (south,west,north,east)
 *  - now?: string ISO8601          (defaults to current time)
 *  - debug_ignore_time?: 'true'    (skip weekday/time window checks; for UI testing)
 *
 * Timezone: America/Toronto
 */

import { FastifyInstance } from 'fastify'
import { toZonedTime, formatInTimeZone } from 'date-fns-tz'
import { getPool } from '../db.js' // make sure you have apps/api/src/db.ts exporting getPool()

type QP = {
  city?: string
  bbox?: string // "south,west,north,east"
  now?: string // ISO
  debug_ignore_time?: 'true' | 'false' | string
}

// Parse bbox safely and validate order
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

    // ---------- Time handling (Toronto local) ----------
    const zone = 'America/Toronto'
    const utcNow = qp.now ? new Date(qp.now) : new Date()
    if (Number.isNaN(utcNow.getTime())) {
      return reply
        .status(400)
        .send({ error: 'BAD_REQUEST', message: 'Invalid now timestamp' })
    }

    const zoned = toZonedTime(utcNow, zone)
    // Canonical weekday: 1..7 (Mon..Sun)
    const dow1to7 = zoned.getDay() === 0 ? 7 : zoned.getDay()
    const hhmmLocal = formatInTimeZone(utcNow, zone, 'HH:mm') // '12:30'
    const dateLocal = formatInTimeZone(utcNow, zone, 'yyyy-MM-dd') // '2025-09-10'

    // ---------- Dynamic SQL building ----------
    const conds: string[] = [
      `d.is_active = true`,
      `($1::date is null or d.valid_from is null or d.valid_from <= $1::date)`,
      `($1::date is null or d.valid_to   is null or d.valid_to   >= $1::date)`,
    ]
    const params: unknown[] = [dateLocal]

    // Optional weekday/time window checks (skip if debug flag)
    const ignoreTime = qp.debug_ignore_time === 'true'
    if (!ignoreTime) {
      // Support both encodings for days_of_week:
      //  - 1..7 (Mon..Sun): match $2 directly
      //  - 0..6 (Sun..Sat): match ($2 % 7) where Sun(7)→0
      conds.push(
        `( $2 = ANY(d.days_of_week) OR (($2 % 7) = ANY(d.days_of_week)) )`
      )
      conds.push(`d.start_time <= $3::time AND d.end_time >= $3::time`)
      params.push(dow1to7, hhmmLocal)
    }

    // City (tolerant: prefix, case-insensitive)
    if (qp.city && qp.city.trim().length > 0) {
      params.push(`${qp.city.trim()}%`)
      conds.push(`lower(r.city) LIKE lower($${params.length})`)
    }

    // BBox (south,west,north,east)
    const bbox = parseBBox(qp.bbox)
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
        r.reviews_count
      FROM deal d
      JOIN restaurant r ON r.id = d.restaurant_id
      WHERE ${conds.join(' AND ')}
      ORDER BY r.rating DESC NULLS LAST,
               r.reviews_count DESC,
               d.start_time ASC
      LIMIT 100
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
