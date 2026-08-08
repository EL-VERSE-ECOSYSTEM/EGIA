create table if not exists public.user_fcm_tokens (
  id uuid primary key default gen_random_uuid(), user_id text not null references public."user"(id) on delete cascade,
  token text not null, device_name varchar(255), device_type varchar(50) default 'web', browser varchar(255), os varchar(100), is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, token)
);
create index if not exists idx_user_fcm_tokens_user_id on public.user_fcm_tokens(user_id);
create table if not exists public.notification_history (
  id uuid primary key default gen_random_uuid(), user_id text references public."user"(id) on delete set null,
  title varchar(255) not null, body text not null, type varchar(50) not null, data jsonb, sent_at timestamptz not null default now(), delivered boolean not null default false, read_at timestamptz, link varchar(255), metadata jsonb
);
create index if not exists idx_notification_history_user_id on public.notification_history(user_id);
alter publication supabase_realtime add table public.notification_history;
