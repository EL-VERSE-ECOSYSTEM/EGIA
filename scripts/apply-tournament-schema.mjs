import postgres from 'postgres'
import fs from 'node:fs'
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

async function applyTournamentSchema() {
  loadLocalEnvironment()

  const databaseUrl = process.env.SUPABASE_DATABASE_POOLER_URL || process.env.DATABASE_URL
  if (!databaseUrl) {
    console.warn('No database connection string present in environment. Skipping remote DDL execution.')
    return
  }

  console.log('Connecting to Supabase Database...')
  const sql = postgres(databaseUrl, {
    ssl: { rejectUnauthorized: false },
    max: 1,
    connect_timeout: 15,
  })

  const tournamentSql = `
    CREATE TABLE IF NOT EXISTS public.tournament_scores (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL REFERENCES public.school(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES public.user(id) ON DELETE CASCADE,
      game_type TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      is_win BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_tournament_scores_school_id ON public.tournament_scores(school_id);
    CREATE INDEX IF NOT EXISTS idx_tournament_scores_student_id ON public.tournament_scores(student_id);

    CREATE TABLE IF NOT EXISTS public.otp_records (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_otp_records_email ON public.otp_records(email);

    CREATE TABLE IF NOT EXISTS public.admission_number_sequences (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      schoolid TEXT NOT NULL UNIQUE,
      last_number INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_admission_number_sequences_schoolid ON public.admission_number_sequences(schoolid);

    ALTER TABLE public.tournament_scores ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.otp_records ENABLE ROW LEVEL SECURITY;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'tournament_scores' AND policyname = 'tournament_scores_select_policy'
      ) THEN
        CREATE POLICY "tournament_scores_select_policy" ON public.tournament_scores
          FOR SELECT USING (auth.role() = 'authenticated');
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'tournament_scores' AND policyname = 'tournament_scores_insert_policy'
      ) THEN
        CREATE POLICY "tournament_scores_insert_policy" ON public.tournament_scores
          FOR INSERT WITH CHECK (auth.uid()::text = student_id);
      END IF;
    END $$;

    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'otp_records' AND policyname = 'otp_records_service_role'
      ) THEN
        CREATE POLICY "otp_records_service_role" ON public.otp_records
          FOR ALL USING (auth.role() = 'service_role');
      END IF;
    END $$;

    DO $$ BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_scores;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_object THEN NULL;
    END $$;
  `

  try {
    console.log('Applying tournament and OTP schema directly to Supabase Database...')
    await sql.unsafe(tournamentSql)
    console.log('Successfully applied tournament_scores and otp_records to Supabase Database!')
  } catch (err) {
    console.error('Error applying tournament schema:', err)
    process.exitCode = 1
  } finally {
    await sql.end({ timeout: 5 })
  }
}

applyTournamentSchema()
