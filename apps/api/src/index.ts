/**
 * Fastify API entrypoint
 * - Loads .env from apps/api/.env
 * - Provides /health, /debug/env, /v1/restaurants
 */

import Fastify from 'fastify'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Force override so shell/root vars don't win
dotenv.config({ path: join(__dirname, '../.env'), override: true })

import { query } from './db.js'

const app = Fastify({
  logger: { level: 'info', transport: { target: 'pino-pretty' } } as any,
})

// --- Health check ---
app.get('/health', async () => ({ ok: true }))

// --- Debug route (TEMP: remove once DB works) ---
app.get('/debug/env', async () => {
  const url = process.env.DATABASE_URL || ''
  return {
    hasUrl: !!url,
    urlPrefix: url.slice(0, 30) + (url.length > 30 ? '...' : ''),
    port: process.env.PORT || null,
    nodeEnv: process.env.NODE_ENV || null,
  }
})

// --- List restaurants ---
/**
 * GET /v1/restaurants
 * Query params:
 * - city=Milton
 * - cuisine=Pizza,Indian
 * - bbox=south,west,north,east
 * - limit=50
 */
app.get('/v1/restaurants', async (req, reply) => {
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
        `lat >= $${params.length - 3} AND lat <= $${params.length - 2} 
         AND lng >= $${params.length - 1} AND lng <= $${params.length}`
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

// --- Start server ---
const port = Number(process.env.PORT || 4000)
app.listen({ port, host: '0.0.0.0' }).then(() => {
  console.log(`api listening on http://localhost:${port}`)
})
