import { Pool, QueryResultRow } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false } // enable if needed in cloud
})

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[]
): Promise<{ rows: T[] }> {
  const res = await pool.query<T>(text, params)
  return { rows: res.rows }
}
