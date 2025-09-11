import Fastify from 'fastify'
import dotenv from 'dotenv'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { z } from 'zod'
import { getDealsToday } from './routes/deals-today.js'
import { Pool } from 'pg'

dotenv.config()

const app = Fastify({
  logger: { level: 'info' },
})

// ---- Security & CORS
await app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", '*'],
    },
  },
})
await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
})

// ---- DB readiness probe
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
let dbReady = false
pool.query('select 1').then(
  () => (dbReady = true),
  () => (dbReady = false)
)

// ---- Health & Ready
app.get('/health', async () => ({ ok: true }))
app.get('/ready', async () => ({ ok: dbReady }))

// ---- Consistent error shape
app.setErrorHandler((err, _req, reply) => {
  const status = (err as any)?.validation ? 400 : (err.statusCode ?? 500)
  reply.status(status).send({
    code:
      status === 400
        ? 'BAD_REQUEST'
        : status === 401
          ? 'UNAUTHORIZED'
          : status === 403
            ? 'FORBIDDEN'
            : status === 404
              ? 'NOT_FOUND'
              : 'INTERNAL',
    message: err.message,
    details: (err as any).validation ?? undefined,
    requestId: reply.getHeader('x-request-id') ?? null,
  })
})

// ---- /v1/restaurants (kept minimal; optional)
app.get('/v1/restaurants', async (req) => {
  // You can keep your existing implementation here.
  return { items: [] }
})

// ---- /v1/deals/today with zod validation
const dealsQuery = z.object({
  city: z.string().min(1).optional(),
  cuisine: z.string().optional(), // comma-separated
  bbox: z
    .string()
    .regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)
    .optional(),
  now: z.string().datetime().optional(), // ISO
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

app.get('/v1/deals/today', async (req) => {
  const qp = dealsQuery.parse((req as any).query)
  const items = await getDealsToday(qp)
  return { items }
})

const port = Number(process.env.PORT || 4000)
app
  .listen({ port, host: '0.0.0.0' })
  .then(() => app.log.info(`api listening on http://localhost:${port}`))
