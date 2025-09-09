/**
 * apps/api/src/index.ts
 *
 * Entrypoint for the Fastify API server.
 * - Loads env vars from .env
 * - Sets up Fastify with logging + CORS
 * - Registers routes (e.g., deals-today)
 */

import Fastify from 'fastify'
import dotenv from 'dotenv'
import cors from '@fastify/cors'

// Load env vars early
dotenv.config()

import dealsToday from './routes/deals-today.js'

async function start() {
  const app = Fastify({ logger: true })

  // CORS so the frontend can call this API
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? true, // e.g. http://localhost:5173
  })

  // Health check
  app.get('/health', async () => ({ ok: true }))

  // Our deals endpoint
  await app.register(dealsToday)

  const port = Number(process.env.PORT || 4000)
  try {
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`API listening on http://localhost:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
