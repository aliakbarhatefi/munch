import { Pool } from 'pg'
import type { QueryResultRow } from 'pg'
import { ENV } from './config.js'

export const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
})

/**
 * Thin wrapper that preserves the familiar `{ rows }` shape while keeping types.
 * - T defaults to `QueryResultRow` but can be specified by callers.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: ReadonlyArray<unknown>
): Promise<{ rows: T[] }> {
  const res = await pool.query(text, params as never)
  return { rows: res.rows as T[] }
}
