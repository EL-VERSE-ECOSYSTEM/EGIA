import postgres from 'postgres'
import fs from 'node:fs'
import path from 'node:path'
import { setDefaultResultOrder } from 'node:dns'

setDefaultResultOrder('ipv4first')

function loadLocalEnvironment() {
  for (const file of ['.env', '.env.local']) {
    try {
      process.loadEnvFile(file)
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
  }
}

async function applySchema() {
  loadLocalEnvironment()

  const databaseUrl = process.env.SUPABASE_DATABASE_POOLER_URL || process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('Database connection string missing in environment.')
  }

  const sqlFilePath = path.join(process.cwd(), 'schema_complete.sql')
  const sqlScript = fs.readFileSync(sqlFilePath, 'utf8')

  console.log('Connecting to Supabase Database...')
  const sql = postgres(databaseUrl, {
    ssl: { rejectUnauthorized: false },
    max: 1,
    connect_timeout: 15,
  })

  try {
    console.log('Applying canonical schema_complete.sql to Supabase database...')
    await sql.unsafe(sqlScript)
    console.log('Schema successfully applied to Supabase database!')
  } catch (err) {
    console.error('Error applying schema:', err)
    process.exitCode = 1
  } finally {
    await sql.end({ timeout: 5 })
  }
}

applySchema()
