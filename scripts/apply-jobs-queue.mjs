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

async function applyJobsQueueSchema() {
  loadLocalEnvironment()

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

  const jobsQueueSql = `
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
        CREATE TYPE job_status AS ENUM ('pending', 'running', 'completed', 'failed', 'dead');
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS public.jobs (
      id              BIGSERIAL PRIMARY KEY,
      queue           TEXT NOT NULL DEFAULT 'default',
      type            TEXT NOT NULL,
      payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
      status          job_status NOT NULL DEFAULT 'pending',
      priority        SMALLINT NOT NULL DEFAULT 100,
      attempts        SMALLINT NOT NULL DEFAULT 0,
      max_attempts    SMALLINT NOT NULL DEFAULT 5,
      run_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
      locked_by       TEXT,
      locked_until    TIMESTAMPTZ,
      last_error      TEXT,
      idempotency_key TEXT UNIQUE,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
      updatedAt      TIMESTAMPTZ NOT NULL DEFAULT now(),
      completed_at    TIMESTAMPTZ
    );

    CREATE INDEX IF NOT EXISTS jobs_claim_idx ON public.jobs (queue, priority, run_at) WHERE status = 'pending';
    CREATE INDEX IF NOT EXISTS jobs_running_idx ON public.jobs (locked_until) WHERE status = 'running';
    CREATE INDEX IF NOT EXISTS jobs_type_status_idx ON public.jobs (type, status);
    CREATE INDEX IF NOT EXISTS jobs_created_idx ON public.jobs (created_at DESC);

    CREATE OR REPLACE FUNCTION public.enqueue_job(
      p_type           TEXT,
      p_payload        JSONB,
      p_queue          TEXT    DEFAULT 'default',
      p_priority       SMALLINT DEFAULT 100,
      p_run_at         TIMESTAMPTZ DEFAULT now(),
      p_max_attempts   SMALLINT DEFAULT 5,
      p_idempotency_key TEXT DEFAULT NULL
    ) RETURNS BIGINT
    LANGUAGE plpgsql SECURITY DEFINER AS $$
    DECLARE v_id BIGINT;
    BEGIN
      IF p_idempotency_key IS NOT NULL THEN
        INSERT INTO public.jobs (type, payload, queue, priority, run_at, max_attempts, idempotency_key)
        VALUES (p_type, p_payload, p_queue, p_priority, p_run_at, p_max_attempts, p_idempotency_key)
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING id INTO v_id;
        IF v_id IS NOT NULL THEN RETURN v_id; END IF;
        SELECT id INTO v_id FROM public.jobs WHERE idempotency_key = p_idempotency_key;
        RETURN v_id;
      END IF;

      INSERT INTO public.jobs (type, payload, queue, priority, run_at, max_attempts)
      VALUES (p_type, p_payload, p_queue, p_priority, p_run_at, p_max_attempts)
      RETURNING id INTO v_id;
      RETURN v_id;
    END; $$;

    CREATE OR REPLACE FUNCTION public.claim_jobs(
      p_queue         TEXT,
      p_worker_id     TEXT,
      p_batch_size    INT DEFAULT 5,
      p_lease_seconds INT DEFAULT 90
    ) RETURNS SETOF public.jobs
    LANGUAGE plpgsql SECURITY DEFINER AS $$
    BEGIN
      RETURN QUERY
      UPDATE public.jobs j
      SET status       = 'running',
          locked_by    = p_worker_id,
          locked_until = now() + make_interval(secs => p_lease_seconds),
          attempts     = j.attempts + 1,
          updatedAt   = now()
      FROM (
        SELECT id FROM public.jobs
        WHERE queue   = p_queue
          AND status  = 'pending'
          AND run_at <= now()
        ORDER BY priority ASC, run_at ASC
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
      ) c
      WHERE j.id = c.id
      RETURNING j.*;
    END; $$;

    CREATE OR REPLACE FUNCTION public.complete_job(
      p_job_id BIGINT, p_worker_id TEXT
    ) RETURNS BOOLEAN
    LANGUAGE plpgsql SECURITY DEFINER AS $$
    DECLARE v_count INT;
    BEGIN
      UPDATE public.jobs
      SET status = 'completed', completed_at = now(),
          locked_by = NULL, locked_until = NULL, updatedAt = now()
      WHERE id = p_job_id AND locked_by = p_worker_id AND status = 'running';
      GET DIAGNOSTICS v_count = ROW_COUNT;
      RETURN v_count > 0;
    END; $$;

    CREATE OR REPLACE FUNCTION public.fail_job(
      p_job_id BIGINT, p_worker_id TEXT, p_error TEXT
    ) RETURNS TEXT
    LANGUAGE plpgsql SECURITY DEFINER AS $$
    DECLARE v_job public.jobs; v_status job_status; v_backoff INTERVAL;
    BEGIN
      SELECT * INTO v_job FROM public.jobs
        WHERE id = p_job_id AND locked_by = p_worker_id AND status = 'running';
      IF NOT FOUND THEN RETURN 'not_owner'; END IF;

      IF v_job.attempts >= v_job.max_attempts THEN
        v_status := 'dead'; v_backoff := INTERVAL '0';
      ELSE
        v_status := 'pending';
        v_backoff := make_interval(secs => LEAST(3600, (30 * power(2, v_job.attempts))::int));
      END IF;

      UPDATE public.jobs
      SET status = v_status, last_error = p_error,
          run_at = now() + v_backoff,
          locked_by = NULL, locked_until = NULL, updatedAt = now()
      WHERE id = p_job_id;
      RETURN v_status::TEXT;
    END; $$;

    CREATE OR REPLACE FUNCTION public.reap_stuck_jobs()
    RETURNS INT LANGUAGE plpgsql SECURITY DEFINER AS $$
    DECLARE v_count INT;
    BEGIN
      UPDATE public.jobs
      SET status = CASE WHEN attempts >= max_attempts THEN 'dead'::job_status ELSE 'pending'::job_status END,
          run_at = now() + INTERVAL '30 seconds',
          locked_by = NULL, locked_until = NULL,
          last_error = 'lease expired', updatedAt = now()
      WHERE status = 'running' AND locked_until < now();
      GET DIAGNOSTICS v_count = ROW_COUNT;
      RETURN v_count;
    END; $$;
  `;

  try {
    console.log('Applying jobs queue schema & RPC functions to Supabase database...')
    await sql.unsafe(jobsQueueSql)
    console.log('Jobs queue schema & RPC functions successfully applied to Supabase database!')
  } catch (err) {
    console.error('Error applying jobs queue schema:', err)
    process.exitCode = 1
  } finally {
    await sql.end({ timeout: 5 })
  }
}

applyJobsQueueSchema()
