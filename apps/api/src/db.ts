// apps/api/src/db.ts
import { Pool, QueryResultRow } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

// Create a connection pool for Postgres
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false } // uncomment if you need SSL (e.g., cloud DBs)
})

/**
 * Run a SQL query safely with parameter binding.
 * T is constrained to pg's QueryResultRow to satisfy type requirements.
 * @param text SQL query string with $1..$n placeholders
 * @param params Array of parameters
 * @returns Rows from the query result
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[]
): Promise<{ rows: T[] }> {
  const res = await pool.query<T>(text, params)
  return { rows: res.rows }
}
