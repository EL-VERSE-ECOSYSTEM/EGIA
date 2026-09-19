import postgres from 'postgres'
import fs from 'node:fs'
import path from 'node:path'
import { setDefaultResultOrder } from 'node:dns'

setDefaultResultOrder('ipv4first')

function loadLocalEnvironment() {
  if (typeof process.loadEnvFile === 'function') {
    for (const file of ['.env', '.env.local']) {
      try {
        process.loadEnvFile(file)
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error
      }
    }
  } else {
    for (const file of ['.env', '.env.local']) {
      try {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8')
          for (const line of content.split('\n')) {
            const trimmed = line.trim()
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
              const [key, ...vals] = trimmed.split('=')
              const val = vals.join('=').replace(/^["']|["']$/g, '')
              if (key && !process.env[key.trim()]) {
                process.env[key.trim()] = val
              }
            }
          }
        }
      } catch (error) {
        console.warn('Could not read env file:', error)
      }
    }
  }
}

async function applyMigration() {
  loadLocalEnvironment()

  const databaseUrl = process.env.SUPABASE_DATABASE_POOLER_URL || process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('Database connection string missing in environment.')
  }

  const sqlFilePath = path.join(process.cwd(), 'corrective_migration.sql')
  const sqlScript = fs.readFileSync(sqlFilePath, 'utf8')

  console.log('Connecting to Supabase Database...')
  const sql = postgres(databaseUrl, {
    ssl: { rejectUnauthorized: false },
    max: 1,
    connect_timeout: 15,
  })

  try {
    console.log('Applying non-destructive corrective_migration.sql to Supabase database...')
    await sql.unsafe(sqlScript)
    console.log('Corrective migration successfully applied to Supabase database!')
  } catch (err) {
    console.error('Error applying migration:', err)
    process.exitCode = 1
  } finally {
    await sql.end({ timeout: 5 })
  }
}

applyMigration()
