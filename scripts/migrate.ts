// scripts/migrate.ts
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import dotenv from 'dotenv'
import { Client } from 'pg'

// Load env from repo root .env by default
dotenv.config()

// When compiled to CJS, __dirname is available.
// This file lives at <repoRoot>/scripts/migrate.ts
const repoRoot = path.resolve(__dirname, '..')
const MIGRATIONS_DIR = path.join(repoRoot, 'db', 'migrations')
const SEEDS_DIR = path.join(repoRoot, 'db', 'seeds')

type MigrationRecord = {
  id: number
  filename: string
  checksum: string
  applied_at: string
}

function sha256(buf: Buffer | string) {
  return crypto.createHash('sha256').update(buf).digest('hex')
}

async function ensureMigrationsTable(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)
}

function listSqlFiles(dir: string) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Missing directory: ${dir}`)
  }
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

async function alreadyApplied(client: Client) {
  const { rows } = await client.query<MigrationRecord>(
    'SELECT * FROM migrations ORDER BY id ASC'
  )
  const map = new Map<string, MigrationRecord>()
  for (const r of rows) map.set(r.filename, r)
  return map
}

async function applyMigration(
  client: Client,
  filepath: string,
  filename: string
) {
  const sql = fs.readFileSync(filepath)
  const checksum = sha256(sql)
  console.log(`→ Applying ${filename} …`)
  await client.query('BEGIN')
  try {
    await client.query(sql.toString())
    await client.query(
      'INSERT INTO migrations(filename, checksum) VALUES ($1,$2)',
      [filename, checksum]
    )
    await client.query('COMMIT')
    console.log(`✓ Applied ${filename}`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(`✗ Failed ${filename}`)
    throw err
  }
}

async function verifyChecksum(
  client: Client,
  filepath: string,
  filename: string
) {
  const sql = fs.readFileSync(filepath)
  const checksum = sha256(sql)
  const { rows } = await client.query<MigrationRecord>(
    'SELECT checksum FROM migrations WHERE filename = $1',
    [filename]
  )
  if (rows.length && rows[0].checksum !== checksum) {
    throw new Error(
      `Checksum mismatch for ${filename}. It was changed after being applied. ` +
        `Expected ${rows[0].checksum}, got ${checksum}.`
    )
  }
}

async function runMigrations(connectionString: string) {
  const client = new Client({ connectionString })
  await client.connect()
  try {
    await ensureMigrationsTable(client)
    const applied = await alreadyApplied(client)
    const files = listSqlFiles(MIGRATIONS_DIR)

    for (const filename of files) {
      const fp = path.join(MIGRATIONS_DIR, filename)
      if (applied.has(filename)) {
        await verifyChecksum(client, fp, filename)
        console.log(`= Skipped (already applied): ${filename}`)
      } else {
        await applyMigration(client, fp, filename)
      }
    }
  } finally {
    await client.end()
  }
}

async function maybeRunSeed(connectionString: string, seedFilename?: string) {
  if (!seedFilename) return
  const fp = path.join(SEEDS_DIR, seedFilename)
  if (!fs.existsSync(fp)) {
    throw new Error(`Seed file not found: ${fp}`)
  }
  const client = new Client({ connectionString })
  await client.connect()
  try {
    console.log(`→ Seeding from ${seedFilename} …`)
    const sql = fs.readFileSync(fp, 'utf8')
    await client.query('BEGIN')
    await client.query(sql)
    await client.query('COMMIT')
    console.log(`✓ Seed complete`)
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    await client.end()
  }
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('Missing DATABASE_URL in environment')

  console.log(
    `migrate.ts using:\n  repoRoot: ${repoRoot}\n  migrations: ${MIGRATIONS_DIR}\n  seeds: ${SEEDS_DIR}`
  )

  await runMigrations(url)

  // Optional: run a default seed file
  // await maybeRunSeed(url, '0001_seed_core.sql');
}

main().catch((err) => {
  console.error('Migration runner crashed:', err)
  process.exit(1)
})
