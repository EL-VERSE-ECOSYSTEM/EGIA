-- EGIA Phases 2-4: persistent queue, idempotency, limits, feature flags, audit and rate limiting.
-- These tables intentionally live in public schema because the application uses the server-side
-- Postgres connection. They are not exposed to end users through grants.

create table if not exists public.egia_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'PENDING' check (status in ('PENDING','PROCESSING','COMPLETED','FAILED','DEAD_LETTER')),
  priority integer not null default 100,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  last_error text,
  idempotency_key text,
  school_id text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists egia_jobs_claim_idx
  on public.egia_jobs (status, priority desc, available_at asc)
  where status in ('PENDING','FAILED');
create index if not exists egia_jobs_school_idx on public.egia_jobs (school_id, created_at desc);
create unique index if not exists egia_jobs_idempotency_idx
  on public.egia_jobs (job_type, idempotency_key)
  where idempotency_key is not null;

create table if not exists public.egia_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  idempotency_key text not null,
  request_hash text,
  status text not null default 'PROCESSING' check (status in ('PROCESSING','COMPLETED','FAILED')),
  response_code integer,
  response_body jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scope, idempotency_key)
);
create index if not exists egia_idempotency_expiry_idx on public.egia_idempotency_keys (expires_at);

create table if not exists public.egia_school_resource_limits (
  school_id text primary key,
  max_students integer not null default 10000,
  max_storage_bytes bigint not null default 10737418240,
  max_concurrent_cbt integer not null default 100,
  max_report_jobs integer not null default 10,
  max_api_requests_per_minute integer not null default 600,
  max_concurrent_exports integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.egia_feature_flags (
  key text primary key,
  enabled boolean not null default true,
  description text,
  updated_by text,
  updated_at timestamptz not null default now()
);

insert into public.egia_feature_flags (key, enabled, description) values
 ('maintenance_mode', false, 'Put non-essential application writes into maintenance mode'),
 ('read_only_mode', false, 'Disable mutating application operations'),
 ('disable_ai', false, 'Disable AI-powered features while keeping core application online'),
 ('disable_exports', false, 'Disable expensive report/export jobs'),
 ('disable_bulk_imports', false, 'Disable bulk import workloads'),
 ('disable_realtime_presence', false, 'Disable realtime presence while retaining core data'),
 ('disable_new_cbt_sessions', false, 'Prevent creation of new CBT sessions'),
 ('disable_external_integrations', false, 'Stop non-critical outbound integrations')
on conflict (key) do nothing;

create table if not exists public.egia_audit_log (
  event_id uuid primary key default gen_random_uuid(),
  actor_id text,
  school_id text,
  event_type text not null,
  resource_type text,
  resource_id text,
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists egia_audit_school_time_idx on public.egia_audit_log (school_id, created_at desc);
create index if not exists egia_audit_actor_time_idx on public.egia_audit_log (actor_id, created_at desc);
create index if not exists egia_audit_event_time_idx on public.egia_audit_log (event_type, created_at desc);

create table if not exists public.egia_rate_limits (
  bucket_key text not null,
  window_started_at timestamptz not null,
  count integer not null default 0,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (bucket_key, window_started_at)
);
create index if not exists egia_rate_limits_expiry_idx on public.egia_rate_limits (expires_at);

revoke all on public.egia_jobs from anon, authenticated;
revoke all on public.egia_idempotency_keys from anon, authenticated;
revoke all on public.egia_school_resource_limits from anon, authenticated;
revoke all on public.egia_feature_flags from anon, authenticated;
revoke all on public.egia_audit_log from anon, authenticated;
revoke all on public.egia_rate_limits from anon, authenticated;

-- Atomic token-bucket-like fixed-window limiter. Returns the new count.
create or replace function public.egia_rate_limit_hit(
  p_bucket_key text,
  p_window_seconds integer,
  p_limit integer
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_started timestamptz;
  v_count integer;
begin
  if p_window_seconds < 1 or p_limit < 1 then
    raise exception 'Invalid rate-limit configuration';
  end if;
  v_started := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.egia_rate_limits(bucket_key, window_started_at, count, expires_at)
  values (p_bucket_key, v_started, 1, v_started + make_interval(secs => p_window_seconds))
  on conflict (bucket_key, window_started_at)
  do update set count = public.egia_rate_limits.count + 1, updated_at = now()
  returning count into v_count;
  return v_count;
end;
$$;
revoke execute on function public.egia_rate_limit_hit(text, integer, integer) from public, anon, authenticated;

-- Claim one job atomically. The worker supplies a stable worker id.
create or replace function public.egia_claim_job(p_worker_id text)
returns setof public.egia_jobs
language sql
security definer
set search_path = public
as $$
  with candidate as (
    select id
    from public.egia_jobs
    where (status = 'PENDING' or (status = 'FAILED' and attempts < max_attempts))
      and available_at <= now()
    order by priority desc, available_at asc
    for update skip locked
    limit 1
  )
  update public.egia_jobs j
  set status = 'PROCESSING',
      attempts = j.attempts + 1,
      locked_at = now(),
      locked_by = p_worker_id,
      updated_at = now()
  from candidate c
  where j.id = c.id
  returning j.*;
$$;
revoke execute on function public.egia_claim_job(text) from public, anon, authenticated;
