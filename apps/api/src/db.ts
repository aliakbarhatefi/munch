import { Pool } from 'pg'

let pool: Pool | null = null

/**
 * Lazily create or return the shared PG Pool.
 * Must be called *after* dotenv.config() has loaded DATABASE_URL.
 */
export function getPool(): Pool {
  if (pool) return pool

  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL missing. Define it in apps/api/.env')
  }

  pool = new Pool({
    connectionString: url,
    // Optional: tune these for dev vs prod
    max: 10, // number of connections in pool
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  })

  pool.on('error', (err) => {
    console.error('Unexpected PG client error', err)
    process.exit(-1)
  })

  return pool
}
