import postgres from 'postgres'

function loadLocalEnvironment() {
  for (const file of ['.env', '.env.local']) {
    try {
      process.loadEnvFile(file)
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
    }
  }
}

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required.`)
  return value
}

async function main() {
  loadLocalEnvironment()

  const supabaseUrl = new URL(required('NEXT_PUBLIC_SUPABASE_URL'))
  const publishableKey = required('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  const databaseUrl = new URL(required('DATABASE_URL'))

  if (!supabaseUrl.hostname.endsWith('.supabase.co')) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must point to a hosted Supabase project.')
  }
  if (['localhost', '127.0.0.1', '::1'].includes(databaseUrl.hostname)) {
    throw new Error('DATABASE_URL still points to a local database. Use the Supabase Session pooler URI from Dashboard → Connect.')
  }

  const authResponse = await fetch(new URL('/auth/v1/settings', supabaseUrl), {
    headers: { apikey: publishableKey },
  })
  if (!authResponse.ok) {
    throw new Error(`Supabase Auth check failed with HTTP ${authResponse.status}.`)
  }

  const sql = postgres(databaseUrl.toString(), {
    ssl: { rejectUnauthorized: false },
    max: 1,
    connect_timeout: 15,
  })

  try {
    const [connection] = await sql`select current_database() as database, current_user as role`
    const [writeCheck] = await sql.begin(async (tx) => {
      await tx`create temporary table egia_supabase_connection_check (value text not null) on commit drop`
      await tx`insert into egia_supabase_connection_check (value) values ('write-ok')`
      return tx`select value from egia_supabase_connection_check limit 1`
    })

    if (writeCheck.value !== 'write-ok') throw new Error('Temporary database write check did not return its inserted value.')
    console.log(`Supabase verified: database=${connection.database}; role=${connection.role}; read/write=ok`)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((error) => {
  console.error(`Supabase verification failed: ${error.message}`)
  process.exitCode = 1
})
