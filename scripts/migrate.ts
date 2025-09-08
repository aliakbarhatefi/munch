/**
 * scripts/migrate.ts
 *
 * Minimal SQL migration runner.
 * - Applies .sql files in db/migrations alphabetically, once.
 * - Records applied files in schema_migrations table.
 * - Loads env from repo root .env
 */

import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env')
  process.exit(1)
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `)

    const dir = path.resolve(process.cwd(), 'db/migrations')
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort()

    for (const f of files) {
      const already = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1',
        [f]
      )
      if (already.rowCount > 0) {
        console.log(`⚪ Skipping ${f} (already applied)`)
        continue
      }

      console.log(`▶ Applying ${f}...`)
      const sql = fs.readFileSync(path.join(dir, f), 'utf8')

      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query(
          'INSERT INTO schema_migrations(filename) VALUES ($1)',
          [f]
        )
        await client.query('COMMIT')
        console.log(`✅ Applied ${f}`)
      } catch (err) {
        await client.query('ROLLBACK')
        console.error(`❌ Failed ${f}:`, err)
        process.exit(1)
      }
    }

    console.log('🎉 All migrations applied')
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error('Migration runner crashed:', err)
  process.exit(1)
})
