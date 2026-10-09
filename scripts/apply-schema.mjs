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

async function applySchema() {
  loadLocalEnvironment()

  const sqlFilePath = path.join(process.cwd(), 'schema_complete.sql')
  const sqlScript = fs.readFileSync(sqlFilePath, 'utf8')
  const hasDestructiveStatements =
    /\bDROP\s+(?:TABLE|SCHEMA|DATABASE|TYPE)\b/i.test(sqlScript) ||
    /\bTRUNCATE\b/i.test(sqlScript) ||
    /\bDELETE\s+FROM\b/i.test(sqlScript)

  if (hasDestructiveStatements && process.env.ALLOW_DESTRUCTIVE_SCHEMA_APPLY !== 'true') {
    console.error(
      'CRITICAL: schema_complete.sql contains destructive statements. ' +
      'No database changes were made. Back up the database and set ' +
      'ALLOW_DESTRUCTIVE_SCHEMA_APPLY=true only when a full reset is intended.'
    )
    process.exitCode = 1
    return
  }

  const databaseUrl = process.env.SUPABASE_DATABASE_POOLER_URL || process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('Database connection string missing in environment.')
  }

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
