import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn("DATABASE_URL is not set. Database operations will fail.");
}

// For Supabase connection, we usually use the connection string from env
const client = postgres(connectionString || "postgresql://localhost:5432/postgres", {
  ssl: connectionString?.includes('supabase') || connectionString?.includes('neon') || connectionString?.includes('aws') ? 'require' : false,
  max: 15, // Optimize connection pool size for serverless
  idle_timeout: 20,
  connect_timeout: 15,
})
export const db = drizzle(client, { schema })
