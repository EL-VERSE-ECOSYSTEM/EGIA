-- Migration: 202611010001_scale_resilience_observability.sql
-- Purpose: Add durable jobs, idempotency_keys, outbox_events, school_resource_limits,
--          system_feature_flags, system_incidents, and audit_logs tables.

-- 1. JOBS TABLE (Scale Engine Distributed Coordination)
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue TEXT NOT NULL DEFAULT 'default',
    type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'PENDING',
    priority INTEGER NOT NULL DEFAULT 100,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    locked_at TIMESTAMPTZ,
    locked_by TEXT,
    last_error TEXT,
    idempotency_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS jobs_idempotency_key_idx
ON public.jobs(idempotency_key)
WHERE idempotency_key IS NOT NULL;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'available_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS jobs_status_available_idx ON public.jobs(status, available_at);
  ELSE
    CREATE INDEX IF NOT EXISTS jobs_status_available_idx ON public.jobs(status, run_at);
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'locked_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS jobs_locked_idx ON public.jobs(locked_at);
  ELSE
    CREATE INDEX IF NOT EXISTS jobs_locked_idx ON public.jobs(locked_until);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS jobs_type_status_idx
ON public.jobs(type, status);

CREATE INDEX IF NOT EXISTS jobs_priority_created_idx
ON public.jobs(priority ASC, created_at ASC);

-- 2. IDEMPOTENCY KEYS TABLE
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    operation TEXT NOT NULL,
    request_hash TEXT,
    response JSONB,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idempotency_keys_key_op_idx
ON public.idempotency_keys(key, operation);

CREATE INDEX IF NOT EXISTS idempotency_keys_expires_idx
ON public.idempotency_keys(expires_at);

-- 3. OUTBOX EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    aggregate_type TEXT NOT NULL,
    aggregate_id TEXT NOT NULL,
    school_id TEXT REFERENCES public.school(id) ON DELETE CASCADE,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, COMPLETED, FAILED
    attempts INTEGER NOT NULL DEFAULT 0,
    available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS outbox_events_status_available_idx
ON public.outbox_events(status, available_at)
WHERE status = 'PENDING';

CREATE INDEX IF NOT EXISTS outbox_events_school_idx
ON public.outbox_events(school_id, created_at DESC);

-- 4. SCHOOL RESOURCE LIMITS TABLE
CREATE TABLE IF NOT EXISTS public.school_resource_limits (
    school_id TEXT PRIMARY KEY REFERENCES public.school(id) ON DELETE CASCADE,
    max_students INTEGER NOT NULL DEFAULT 2000,
    max_storage_bytes BIGINT NOT NULL DEFAULT 5368709120, -- 5GB default
    max_daily_exports INTEGER NOT NULL DEFAULT 50,
    max_concurrent_exports INTEGER NOT NULL DEFAULT 3,
    max_daily_ai_requests INTEGER NOT NULL DEFAULT 500,
    max_cbt_sessions INTEGER NOT NULL DEFAULT 100,
    max_api_requests_per_minute INTEGER NOT NULL DEFAULT 300,
    max_bulk_import_rows INTEGER NOT NULL DEFAULT 1000,
    max_notification_batch INTEGER NOT NULL DEFAULT 500,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. SYSTEM FEATURE FLAGS TABLE
CREATE TABLE IF NOT EXISTS public.system_feature_flags (
    key TEXT PRIMARY KEY,
    enabled BOOLEAN NOT NULL DEFAULT true,
    scope TEXT NOT NULL DEFAULT 'global', -- global, school, emergency
    school_id TEXT REFERENCES public.school(id) ON DELETE CASCADE,
    description TEXT,
    updated_by TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS system_feature_flags_scope_school_idx
ON public.system_feature_flags(scope, school_id);

-- Insert critical emergency feature flag defaults
INSERT INTO public.system_feature_flags (key, enabled, scope, description)
VALUES
    ('maintenance_mode', false, 'emergency', 'Enable platform-wide maintenance mode'),
    ('read_only_mode', false, 'emergency', 'Block non-GET mutations platform-wide'),
    ('disable_ai', false, 'emergency', 'Temporarily disable AI operations'),
    ('disable_exports', false, 'emergency', 'Temporarily disable export workloads'),
    ('disable_bulk_imports', false, 'emergency', 'Temporarily disable bulk import operations'),
    ('disable_new_cbt_sessions', false, 'emergency', 'Temporarily prevent starting new CBT sessions'),
    ('disable_realtime', false, 'emergency', 'Fall back to polling and disable realtime'),
    ('disable_notifications', false, 'emergency', 'Pause outbound notifications'),
    ('disable_payments', false, 'emergency', 'Temporarily disable payment checkout')
ON CONFLICT (key) DO NOTHING;

-- 6. SYSTEM INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS public.system_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service TEXT NOT NULL, -- ai, email, fcm, korapay, storage, realtime, database, application
    severity TEXT NOT NULL DEFAULT 'SEV3', -- SEV1, SEV2, SEV3, SEV4
    status TEXT NOT NULL DEFAULT 'OPEN', -- OPEN, INVESTIGATING, MITIGATED, RESOLVED
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    summary TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS system_incidents_status_severity_idx
ON public.system_incidents(status, severity);

-- 7. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    actor_id TEXT,
    school_id TEXT REFERENCES public.school(id) ON DELETE SET NULL,
    actor_role TEXT,
    event_type TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    action TEXT NOT NULL,
    ip_hash TEXT,
    user_agent TEXT,
    request_id TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_school_idx
ON public.audit_logs(school_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_event_type_idx
ON public.audit_logs(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_actor_idx
ON public.audit_logs(actor_id, created_at DESC);
