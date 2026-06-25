import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL || ""

// For Supabase connection, we usually use the connection string from env
// Ensure DATABASE_URL is set in your environment
const client = postgres(connectionString)
export const db = drizzle(client, { schema })
