import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn("DATABASE_URL is not set. Database operations will fail.");
}

// For Supabase connection, we usually use the connection string from env
const client = postgres(connectionString || "postgresql://localhost:5432/postgres")
export const db = drizzle(client, { schema })
