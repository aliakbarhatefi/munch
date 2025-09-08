// apps/api/src/db.ts
import { Pool, QueryResultRow } from 'pg'

let pool: Pool | null = null

/**
 * Lazily initializes the connection pool.
 * Ensures dotenv has already run in index.ts before first use.
 */
function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error(
        'DATABASE_URL is missing. Make sure apps/api/.env is set and dotenv.config() runs in index.ts'
      )
    }
    pool = new Pool({ connectionString: url })
  }
  return pool
}

/**
 * Query helper — safely connects, runs, and releases.
 *
 * @param text SQL string with placeholders ($1, $2, …)
 * @param params Optional parameter array
 * @returns rows typed as T[]
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[] }> {
  const client = await getPool().connect()
  try {
    const res = await client.query<T>(text, params)
    return { rows: res.rows }
  } finally {
    client.release()
  }
}
