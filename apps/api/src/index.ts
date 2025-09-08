/**
 * Fastify API entrypoint
 * Loads environment variables from repo root .env
 */

import Fastify from 'fastify'
import dotenv from 'dotenv'

// Load environment variables from root .env
dotenv.config()

import { query } from './db.js'
import { getDealsToday } from './deals-today.js'

const app = Fastify({
  logger: true, // pretty logging if pino-pretty is installed
})

// Health check
app.get('/health', async () => ({ ok: true }))

// Restaurants listing
app.get('/v1/restaurants', async (req) => {
  const q: any = req.query
  const limit = Math.min(parseInt(q.limit ?? '50', 10), 100)
  const conds: string[] = []
  const params: any[] = []

  if (q.city) {
    params.push(q.city)
    conds.push(`city = $${params.length}`)
  }
  if (q.cuisine) {
    const tags = String(q.cuisine)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (tags.length) {
      params.push(tags)
      conds.push(`cuisine_tags && $${params.length}::text[]`)
    }
  }
  if (q.bbox) {
    const [s, w, n, e] = String(q.bbox).split(',').map(Number)
    if ([s, w, n, e].every(Number.isFinite)) {
      params.push(s, n, w, e)
      conds.push(
        `lat >= $${params.length - 3} AND lat <= $${params.length - 2} AND lng >= $${params.length - 1} AND lng <= $${params.length}`
      )
    }
  }

  const where = conds.length ? `where ${conds.join(' and ')}` : ''
  const sql = `
    select id, name, address, city, province, postal_code,
           lat, lng, price_range, cuisine_tags, rating, reviews_count, pickup_only
    from restaurant
    ${where}
    order by rating desc nulls last, reviews_count desc
    limit ${limit};
  `

  const { rows } = await query(sql, params)
  return { items: rows }
})

// Deals Today
app.get('/v1/deals/today', async (req) => {
  const rows = await getDealsToday((req as any).query)
  return { items: rows }
})

// Start server
const port = Number(process.env.PORT || 4000)
app.listen({ port, host: '0.0.0.0' }).then(() => {
  console.log(`API listening on http://localhost:${port}`)
})
