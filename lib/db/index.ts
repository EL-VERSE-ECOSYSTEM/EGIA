import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is required for database operations.')
}

const databaseHost = new URL(connectionString).hostname
if (['localhost', '127.0.0.1', '::1'].includes(databaseHost)) {
  throw new Error(
    'DATABASE_URL points to a local database. Configure the Supabase Postgres connection string before starting the application.'
  )
}

// For Supabase connection, we usually use the connection string from env
let sslOption: any = false;
if (connectionString?.includes('supabase') || connectionString?.includes('neon') || connectionString?.includes('aws')) {
  // Support self-signed certificates and allow connections to AWS/Supabase pooler endpoints without throwing SELF_SIGNED_CERT_IN_CHAIN or XX000 errors
  sslOption = { rejectUnauthorized: false };
}

const client = postgres(connectionString, {
  ssl: sslOption,
  max: 15, // Optimize connection pool size for serverless
  idle_timeout: 20,
  connect_timeout: 15,
})
export const db = drizzle(client, { schema })
