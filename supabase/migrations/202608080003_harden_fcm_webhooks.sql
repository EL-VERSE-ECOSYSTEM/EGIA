-- Safe upgrades for installations that ran the original notification migration.
alter table public.notification_history add column if not exists event_key text;
create unique index if not exists notification_history_user_event_key_unique
  on public.notification_history(user_id, event_key) where event_key is not null;

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  table_name text not null,
  event_type text not null,
  record_id uuid,
  payload jsonb not null,
  status text not null default 'processing' check (status in ('processing', 'processed', 'failed')),
  error_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.webhook_events enable row level security;
create policy "Service role manages webhook events" on public.webhook_events for all to service_role using (true) with check (true);

-- notification_history is read only by its owner; all writes are server-side.
alter table public.user_fcm_tokens enable row level security;
alter table public.notification_history enable row level security;
drop policy if exists "Users can read their notification history" on public.notification_history;
create policy "Users can read their notification history" on public.notification_history
  for select to authenticated using (auth.uid() = user_id);

do $$ begin
  alter publication supabase_realtime add table public.notification_history;
exception when duplicate_object then null;
end $$;
