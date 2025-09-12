import Fastify from 'fastify'
import authRoutes from './routes/auth.js'
import meRoutes from './routes/me.js'
import { getDealsToday } from './routes/deals-today.js'
import type { DealsQuery } from './routes/deals-today.js'
import { ENV } from './config.js'

const app = Fastify({ logger: true })

// plugins
await app.register(import('@fastify/cors'), { origin: ENV.CORS_ORIGIN })
await app.register(import('@fastify/helmet'), { contentSecurityPolicy: false })

// health
app.get('/health', async () => ({ ok: true }))

// routes
app.register(authRoutes)
app.register(meRoutes)

// deals today (typed querystring → no `any`)
app.get<{ Querystring: DealsQuery }>('/v1/deals/today', async (req, reply) => {
  const rows = await getDealsToday(req.query)
  return reply.send({ items: rows })
})

// ---- start the server ----
async function start() {
  try {
    const port = Number(process.env.PORT || 4000)
    await app.listen({ host: '0.0.0.0', port })
    app.log.info(`api listening on http://localhost:${port}`)
  } catch (err) {
    app.log.error({ err }, 'failed to start server')
    process.exit(1)
  }
}

await start()
