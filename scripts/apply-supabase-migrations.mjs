import fs from 'node:fs/promises'
import path from 'node:path'
import postgres from 'postgres'
import { setDefaultResultOrder } from 'node:dns'

setDefaultResultOrder('ipv4first')

for (const file of ['.env', '.env.local']) {
  try { process.loadEnvFile(file) } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
}

const databaseUrl = process.env.SUPABASE_DATABASE_POOLER_URL || process.env.DATABASE_URL
if (!databaseUrl) throw new Error('SUPABASE_DATABASE_POOLER_URL or DATABASE_URL is required.')
const parsedUrl = new URL(databaseUrl)
if (!parsedUrl.hostname.endsWith('.supabase.com') && !parsedUrl.hostname.endsWith('.supabase.co')) {
  throw new Error('Refusing to apply migrations: database URL is not a hosted Supabase endpoint.')
}

const sql = postgres(databaseUrl, {
  ssl: { rejectUnauthorized: false },
  max: 1,
  connect_timeout: 15,
  prepare: false,
})

try {
  await sql`create schema if not exists supabase_migrations`
  await sql`create table if not exists supabase_migrations.schema_migrations (
    version varchar(255) primary key,
    statements text[],
    name varchar(255)
  )`

  const directory = path.join(process.cwd(), 'supabase', 'migrations')
  const files = (await fs.readdir(directory)).filter((file) => file.endsWith('.sql')).sort()
  for (const file of files) {
    const version = file.slice(0, file.indexOf('_'))
    const [existing] = await sql`select version from supabase_migrations.schema_migrations where version = ${version}`
    if (existing) {
      console.log(`Skipped ${file} (already recorded)`)
      continue
    }

    const contents = await fs.readFile(path.join(directory, file), 'utf8')
    await sql.begin(async (transaction) => {
      await transaction.unsafe(contents)
      await transaction`insert into supabase_migrations.schema_migrations (version, statements, name)
        values (${version}, ${[]}, ${file.slice(version.length + 1, -4)})`
    })
    console.log(`Applied ${file}`)
  }
} finally {
  await sql.end({ timeout: 5 })
}
