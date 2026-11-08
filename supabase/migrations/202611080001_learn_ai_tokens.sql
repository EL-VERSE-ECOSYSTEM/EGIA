create table if not exists public.learn_ai_packages (
  id text primary key,
  tokens integer not null check (tokens > 0),
  price_ngn integer not null check (price_ngn > 0),
  active boolean not null default true
);

insert into public.learn_ai_packages (id, tokens, price_ngn)
values
  ('starter', 35, 5200),
  ('standard', 50, 6800),
  ('plus', 75, 8000),
  ('maximum', 100, 10400)
on conflict (id) do update set tokens = excluded.tokens, price_ngn = excluded.price_ngn;

create table if not exists public.learn_ai_accounts (
  user_id text primary key references public."user" (id) on delete cascade,
  school_id text references public.school (id) on delete set null,
  daily_used integer not null default 0 check (daily_used between 0 and 23),
  window_started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learn_ai_school_settings (
  school_id text primary key references public.school (id) on delete cascade,
  instructions text not null default '' check (char_length(instructions) <= 4000),
  updated_by text references public."user" (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.learn_ai_purchases (
  id text primary key,
  user_id text not null references public."user" (id) on delete cascade,
  school_id text references public.school (id) on delete set null,
  package_id text not null references public.learn_ai_packages (id),
  tokens integer not null check (tokens > 0),
  amount_kobo integer not null check (amount_kobo > 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  reference text not null unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.learn_ai_token_lots (
  id text primary key default gen_random_uuid()::text,
  purchase_id text not null unique references public.learn_ai_purchases (id) on delete cascade,
  user_id text not null references public."user" (id) on delete cascade,
  school_id text references public.school (id) on delete set null,
  remaining_tokens integer not null check (remaining_tokens >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists learn_ai_token_lots_user_expiry_idx
  on public.learn_ai_token_lots (user_id, expires_at)
  where remaining_tokens > 0;

create table if not exists public.learn_ai_usage (
  id text primary key,
  user_id text not null references public."user" (id) on delete cascade,
  school_id text references public.school (id) on delete set null,
  role text not null,
  token_source text not null check (token_source in ('daily', 'monthly')),
  token_lot_id text references public.learn_ai_token_lots (id) on delete set null,
  account_window_started_at timestamptz,
  status text not null default 'reserved' check (status in ('reserved', 'consumed', 'refunded')),
  created_at timestamptz not null default now()
);

create index if not exists learn_ai_usage_user_created_idx
  on public.learn_ai_usage (user_id, created_at desc);

alter table public.learn_ai_packages enable row level security;
alter table public.learn_ai_accounts enable row level security;
alter table public.learn_ai_school_settings enable row level security;
alter table public.learn_ai_purchases enable row level security;
alter table public.learn_ai_token_lots enable row level security;
alter table public.learn_ai_usage enable row level security;

revoke all on public.learn_ai_packages, public.learn_ai_accounts,
  public.learn_ai_school_settings, public.learn_ai_purchases,
  public.learn_ai_token_lots, public.learn_ai_usage
  from public, anon, authenticated;

create or replace function public.consume_learn_ai_token(
  p_user_id text,
  p_school_id text,
  p_role text
)
returns table (
  allowed boolean,
  token_source text,
  daily_remaining integer,
  paid_remaining integer,
  reset_at timestamptz,
  usage_id text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_daily_used integer;
  v_window_started_at timestamptz;
  v_reset_at timestamptz;
  v_lot_id text;
  v_remaining integer;
  v_usage_id text := gen_random_uuid()::text;
begin
  insert into public.learn_ai_accounts (user_id, school_id)
  values (p_user_id, p_school_id)
  on conflict (user_id) do nothing;

  select account.daily_used, account.window_started_at
    into v_daily_used, v_window_started_at
  from public.learn_ai_accounts as account
  where account.user_id = p_user_id
  for update;

  if v_window_started_at <= now() - interval '24 hours' then
    v_daily_used := 0;
    v_window_started_at := now();
    update public.learn_ai_accounts as account
      set daily_used = 0, window_started_at = v_window_started_at,
          school_id = p_school_id, updated_at = now()
    where account.user_id = p_user_id;
  else
    update public.learn_ai_accounts as account
      set school_id = p_school_id, updated_at = now()
    where account.user_id = p_user_id;
  end if;

  v_reset_at := v_window_started_at + interval '24 hours';

  if v_daily_used < 23 then
    update public.learn_ai_accounts as account
      set daily_used = v_daily_used + 1, updated_at = now()
    where account.user_id = p_user_id;

    insert into public.learn_ai_usage (
      id, user_id, school_id, role, token_source, account_window_started_at
    ) values (
      v_usage_id, p_user_id, p_school_id, p_role, 'daily', v_window_started_at
    );

    select coalesce(sum(lot.remaining_tokens), 0)::integer into v_remaining
    from public.learn_ai_token_lots as lot
    where lot.user_id = p_user_id and lot.expires_at > now();

    return query select true, 'daily', 22 - v_daily_used,
      coalesce(v_remaining, 0), v_reset_at, v_usage_id;
    return;
  end if;

  select lot.id into v_lot_id
  from public.learn_ai_token_lots as lot
  where lot.user_id = p_user_id
    and lot.remaining_tokens > 0
    and lot.expires_at > now()
  order by lot.expires_at asc, lot.created_at asc
  limit 1
  for update;

  if v_lot_id is null then
    select coalesce(sum(lot.remaining_tokens), 0)::integer into v_remaining
    from public.learn_ai_token_lots as lot
    where lot.user_id = p_user_id and lot.expires_at > now();
    return query select false, null::text, 0, coalesce(v_remaining, 0), v_reset_at, null::text;
    return;
  end if;

  update public.learn_ai_token_lots as lot
    set remaining_tokens = lot.remaining_tokens - 1
  where lot.id = v_lot_id;

  insert into public.learn_ai_usage (id, user_id, school_id, role, token_source, token_lot_id)
  values (v_usage_id, p_user_id, p_school_id, p_role, 'monthly', v_lot_id);

  select coalesce(sum(lot.remaining_tokens), 0)::integer into v_remaining
  from public.learn_ai_token_lots as lot
  where lot.user_id = p_user_id and lot.expires_at > now();

  return query select true, 'monthly', 0, coalesce(v_remaining, 0), v_reset_at, v_usage_id;
end;
$$;

create or replace function public.finish_learn_ai_usage(p_usage_id text, p_refund boolean default false)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_usage public.learn_ai_usage%rowtype;
begin
  select * into v_usage
  from public.learn_ai_usage
  where id = p_usage_id
  for update;

  if not found or v_usage.status <> 'reserved' then
    return false;
  end if;

  if p_refund then
    if v_usage.token_source = 'daily' then
      update public.learn_ai_accounts as account
        set daily_used = greatest(account.daily_used - 1, 0), updated_at = now()
      where account.user_id = v_usage.user_id
        and account.window_started_at = v_usage.account_window_started_at;
    else
      update public.learn_ai_token_lots as lot
        set remaining_tokens = lot.remaining_tokens + 1
      where lot.id = v_usage.token_lot_id;
    end if;
    update public.learn_ai_usage set status = 'refunded' where id = p_usage_id;
    return true;
  end if;

  update public.learn_ai_usage set status = 'consumed' where id = p_usage_id;
  return true;
end;
$$;

create or replace function public.complete_learn_ai_purchase(p_reference text, p_amount_kobo integer)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_purchase public.learn_ai_purchases%rowtype;
begin
  select * into v_purchase
  from public.learn_ai_purchases
  where reference = p_reference
  for update;

  if not found or v_purchase.amount_kobo <> p_amount_kobo then
    return false;
  end if;

  if v_purchase.status = 'paid' then
    return true;
  end if;
  if v_purchase.status <> 'pending' then
    return false;
  end if;

  update public.learn_ai_purchases
    set status = 'paid', paid_at = now()
  where id = v_purchase.id;

  insert into public.learn_ai_token_lots (
    purchase_id, user_id, school_id, remaining_tokens, expires_at
  ) values (
    v_purchase.id, v_purchase.user_id, v_purchase.school_id,
    v_purchase.tokens, now() + interval '30 days'
  ) on conflict (purchase_id) do nothing;

  return true;
end;
$$;

revoke all on function public.consume_learn_ai_token(text, text, text) from public, anon, authenticated;
revoke all on function public.finish_learn_ai_usage(text, boolean) from public, anon, authenticated;
revoke all on function public.complete_learn_ai_purchase(text, integer) from public, anon, authenticated;
grant execute on function public.consume_learn_ai_token(text, text, text) to service_role;
grant execute on function public.finish_learn_ai_usage(text, boolean) to service_role;
grant execute on function public.complete_learn_ai_purchase(text, integer) to service_role;