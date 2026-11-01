import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import dns from 'dns'
import * as schema from './schema'

if (typeof dns?.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first')
}

// Determine primary database connection string.
// As specified in Phase 2.10: Applications must coordinate through the Supabase Pooler
// and PostgreSQL directly without blindly retrying writes across arbitrary independent nodes.
const primaryConnectionString =
  process.env.SUPABASE_DATABASE_POOLER_URL ||
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@127.0.0.1:5432/postgres'

const databaseHost = new URL(primaryConnectionString).hostname
if (process.env.NODE_ENV === 'production' && ['localhost', '127.0.0.1', '::1'].includes(databaseHost)) {
  throw new Error(
    'DATABASE_URL points to a local database in production. Configure the Supabase Postgres connection string before starting the application.'
  )
}

if (process.env.NODE_ENV === 'production' && /^db\.[a-z0-9-]+\.supabase\.co$/i.test(databaseHost)) {
  console.warn(
    'DATABASE_URL points to the direct Supabase database host. Set SUPABASE_DATABASE_POOLER_URL to the Supabase Session pooler URI for IPv4-compatible load-balanced app traffic.'
  )
}

// Helper to determine SSL option
function getSslOption(connStr: string) {
  if (connStr.includes('supabase') || connStr.includes('neon') || connStr.includes('aws')) {
    if (process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false') {
      return { rejectUnauthorized: false }
    }
    return 'require'
  }
  return false
}

export const sqlClient = postgres(primaryConnectionString, {
  ssl: getSslOption(primaryConnectionString),
  max: Number(process.env.DATABASE_POOL_SIZE || 10),
  prepare: false, // Recommended by Supabase for transaction poolers
  idle_timeout: 30,
  connect_timeout: 15,
})

export const db = drizzle(sqlClient, { schema })
