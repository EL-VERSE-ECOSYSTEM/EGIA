import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.SUPABASE_DATABASE_POOLER_URL || process.env.DATABASE_URL

if (!connectionString) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SUPABASE_DATABASE_POOLER_URL or DATABASE_URL must be configured in production.')
  }
  throw new Error('Database connection is not configured. Set SUPABASE_DATABASE_POOLER_URL or DATABASE_URL.')
}

const host = new URL(connectionString).hostname
if (process.env.NODE_ENV === 'production' && ['localhost', '127.0.0.1', '::1'].includes(host)) {
  throw new Error('A local database connection is not allowed in production.')
}

if (process.env.NODE_ENV === 'production' && /^db\.[a-z0-9-]+\.supabase\.co$/i.test(host)) {
  console.warn('Use SUPABASE_DATABASE_POOLER_URL for production application traffic where possible.')
}

const client = postgres(connectionString, {
  // Supabase poolers multiplex application traffic; keep application-side pools small.
  max: Number(process.env.DATABASE_POOL_SIZE || 5),
  idle_timeout: 30,
  connect_timeout: 15,
  ssl: connectionString.includes('supabase') ? 'require' : undefined,
  prepare: false,
})

export const db = drizzle(client, { schema })
