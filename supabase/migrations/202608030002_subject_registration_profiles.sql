-- Subject registration and profile synchronisation.
-- Apply after 202608030001_production_core.sql / schema_production.sql.
--
-- The normalized tables below are authoritative.  student.subjectsdone and
-- teacher.teachingsubjects are retained as compatibility caches for the
-- existing application and are refreshed automatically by the triggers.

create extension if not exists pgcrypto;

alter table public.subject add column if not exists is_custom boolean not null default false;

-- Read-only endpoint for the search-and-pick control.  It only exposes active
-- catalogue entries; the existing subject RLS policy still applies.
create or replace function public.search_subject_catalogue(p_query text default '')
returns table (id text, name text, code text, is_custom boolean)
language sql stable security invoker set search_path = public as $$
  select s.id, s.name, s.code, s.is_custom
  from public.subject s
  where s.is_active
    and (nullif(trim(p_query), '') is null or s.name ilike '%' || trim(p_query) || '%')
  order by lower(s.name), s.name
  limit 50;
$$;

-- One selected subject per learner and academic session.  A subject entered
-- manually is first added to public.subject (with is_custom = true), so it can
-- subsequently be found and selected from the database like any other subject.
create table if not exists public.student_session_subject (
  id text primary key default gen_random_uuid()::text,
  student_id text not null references public.student(id) on delete cascade,
  session_id text,
  subject_id text not null references public.subject(id) on delete restrict,
  selection_source text not null default 'CATALOGUE'
    check (selection_source in ('CATALOGUE', 'MANUAL')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists student_session_subject_unique
  on public.student_session_subject (student_id, coalesce(session_id, ''), subject_id);
create index if not exists student_session_subject_student_session_idx
  on public.student_session_subject (student_id, session_id);
create index if not exists student_session_subject_subject_idx
  on public.student_session_subject (subject_id);

-- Teacher selections are separate from class allocations (teacher_on_subject),
-- allowing a teacher profile to show all declared teaching subjects even before
-- an administrator assigns a class.
create table if not exists public.teacher_subject_registration (
  id text primary key default gen_random_uuid()::text,
  teacher_id text not null references public.teacher(id) on delete cascade,
  session_id text,
  subject_id text not null references public.subject(id) on delete restrict,
  selection_source text not null default 'CATALOGUE'
    check (selection_source in ('CATALOGUE', 'MANUAL')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists teacher_subject_registration_unique
  on public.teacher_subject_registration (teacher_id, coalesce(session_id, ''), subject_id);
create index if not exists teacher_subject_registration_teacher_session_idx
  on public.teacher_subject_registration (teacher_id, session_id);
create index if not exists teacher_subject_registration_subject_idx
  on public.teacher_subject_registration (subject_id);

create or replace function public.set_subject_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists student_session_subject_timestamp on public.student_session_subject;
create trigger student_session_subject_timestamp before update on public.student_session_subject
for each row execute function public.set_subject_timestamp();
drop trigger if exists teacher_subject_registration_timestamp on public.teacher_subject_registration;
create trigger teacher_subject_registration_timestamp before update on public.teacher_subject_registration
for each row execute function public.set_subject_timestamp();

-- Returns an existing case-insensitive catalogue match or creates a searchable
-- custom catalogue row for manually typed names.
create or replace function public.find_or_create_subject(p_name text, p_is_manual boolean default false)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_name text := nullif(trim(p_name), '');
  v_id text;
begin
  if v_name is null then
    raise exception 'A subject name is required';
  end if;
  if char_length(v_name) > 100 then
    raise exception 'Subject names must be 100 characters or fewer';
  end if;

  select id into v_id from public.subject where lower(trim(name)) = lower(v_name) limit 1;
  if v_id is not null then return v_id; end if;

  insert into public.subject (id, name, is_custom, is_active)
  values (gen_random_uuid()::text, v_name, p_is_manual, true)
  on conflict do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.subject where lower(trim(name)) = lower(v_name) limit 1;
  end if;
  return v_id;
end;
$$;

create or replace function public.refresh_student_subject_cache(p_student_id text)
returns void language plpgsql security definer set search_path = public as $$
declare v_session_id text;
begin
  select sessionid into v_session_id from public.student where id = p_student_id;
  perform set_config('egia.subject_cache_refresh', 'on', true);
  update public.student s
  set subjectsdone = coalesce((
    select jsonb_agg(x.name order by lower(x.name), x.name)
    from (
      select distinct subj.name
      from public.student_session_subject ss
      join public.subject subj on subj.id = ss.subject_id
      where ss.student_id = p_student_id
        and ss.session_id is not distinct from v_session_id
    ) x
  ), '[]'::jsonb), updatedat = now()
  where s.id = p_student_id;
  perform set_config('egia.subject_cache_refresh', 'off', true);
end;
$$;

create or replace function public.refresh_teacher_subject_cache(p_teacher_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform set_config('egia.subject_cache_refresh', 'on', true);
  update public.teacher t
  set teachingsubjects = coalesce((
    select jsonb_agg(x.name order by lower(x.name), x.name)
    from (
      select distinct subj.name
      from public.teacher_subject_registration ts
      join public.subject subj on subj.id = ts.subject_id
      where ts.teacher_id = p_teacher_id
    ) x
  ), '[]'::jsonb), updatedat = now()
  where t.id = p_teacher_id;
  perform set_config('egia.subject_cache_refresh', 'off', true);
end;
$$;

create or replace function public.sync_student_subject_cache()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_name text;
declare v_subject_id text;
begin
  -- Refresh functions update the legacy cache themselves; do not turn that
  -- internal update back into a destructive replacement of registrations.
  if pg_trigger_depth() > 1 or coalesce(current_setting('egia.subject_cache_refresh', true), 'off') = 'on' then return new; end if;

  delete from public.student_session_subject
  where student_id = new.id and session_id is not distinct from new.sessionid;

  for v_name in
    select distinct trim(value #>> '{}')
    from jsonb_array_elements(coalesce(new.subjectsdone, '[]'::jsonb)) value
    where jsonb_typeof(value) = 'string' and nullif(trim(value #>> '{}'), '') is not null
  loop
    v_subject_id := public.find_or_create_subject(v_name, true);
    insert into public.student_session_subject (student_id, session_id, subject_id, selection_source)
    values (new.id, new.sessionid, v_subject_id, 'MANUAL')
    on conflict do nothing;
  end loop;
  return new;
end;
$$;

create or replace function public.sync_teacher_subject_cache()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_name text;
declare v_subject_id text;
begin
  if pg_trigger_depth() > 1 or coalesce(current_setting('egia.subject_cache_refresh', true), 'off') = 'on' then return new; end if;

  delete from public.teacher_subject_registration where teacher_id = new.id;
  for v_name in
    select distinct trim(value #>> '{}')
    from jsonb_array_elements(coalesce(new.teachingsubjects, '[]'::jsonb)) value
    where jsonb_typeof(value) = 'string' and nullif(trim(value #>> '{}'), '') is not null
  loop
    v_subject_id := public.find_or_create_subject(v_name, true);
    insert into public.teacher_subject_registration (teacher_id, subject_id, selection_source)
    values (new.id, v_subject_id, 'MANUAL')
    on conflict do nothing;
  end loop;
  return new;
end;
$$;

create or replace function public.refresh_subject_profile_cache()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name = 'student_session_subject' then
    if tg_op = 'DELETE' then
      perform public.refresh_student_subject_cache(old.student_id);
    else
      perform public.refresh_student_subject_cache(new.student_id);
    end if;
  else
    if tg_op = 'DELETE' then
      perform public.refresh_teacher_subject_cache(old.teacher_id);
    else
      perform public.refresh_teacher_subject_cache(new.teacher_id);
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists student_subject_cache_to_rows on public.student;
create trigger student_subject_cache_to_rows after insert or update of subjectsdone on public.student
for each row execute function public.sync_student_subject_cache();
drop trigger if exists teacher_subject_cache_to_rows on public.teacher;
create trigger teacher_subject_cache_to_rows after insert or update of teachingsubjects on public.teacher
for each row execute function public.sync_teacher_subject_cache();

drop trigger if exists student_subject_rows_to_cache on public.student_session_subject;
create trigger student_subject_rows_to_cache after insert or update or delete on public.student_session_subject
for each row execute function public.refresh_subject_profile_cache();
drop trigger if exists teacher_subject_rows_to_cache on public.teacher_subject_registration;
create trigger teacher_subject_rows_to_cache after insert or update or delete on public.teacher_subject_registration
for each row execute function public.refresh_subject_profile_cache();

-- Backfill the new relationship tables from the values already used by the app.
insert into public.student_session_subject (student_id, session_id, subject_id, selection_source)
select s.id, s.sessionid, public.find_or_create_subject(trim(value #>> '{}'), true), 'MANUAL'
from public.student s
cross join lateral jsonb_array_elements(coalesce(s.subjectsdone, '[]'::jsonb)) value
where jsonb_typeof(value) = 'string' and nullif(trim(value #>> '{}'), '') is not null
on conflict do nothing;

insert into public.teacher_subject_registration (teacher_id, subject_id, selection_source)
select t.id, public.find_or_create_subject(trim(value #>> '{}'), true), 'MANUAL'
from public.teacher t
cross join lateral jsonb_array_elements(coalesce(t.teachingsubjects, '[]'::jsonb)) value
where jsonb_typeof(value) = 'string' and nullif(trim(value #>> '{}'), '') is not null
on conflict do nothing;

-- Search-ready profile views.  Existing profile pages can continue reading the
-- JSON compatibility columns; new pages/reports should query these views.
create or replace view public.student_subject_profile as
select ss.student_id, s.admissionnumber, s.firstname, s.lastname, s.class,
       subj.name as subject_name, s.userid, ss.session_id,
       subj.id as subject_id, ss.selection_source
from public.student_session_subject ss
join public.student s on s.id = ss.student_id
join public.subject subj on subj.id = ss.subject_id;

create or replace view public.teacher_subject_profile as
select ts.teacher_id, t.staffcode, t.firstname, t.lastname,
       subj.name as subject_name, t.userid, ts.session_id,
       subj.id as subject_id, ts.selection_source
from public.teacher_subject_registration ts
join public.teacher t on t.id = ts.teacher_id
join public.subject subj on subj.id = ts.subject_id;

alter view public.student_subject_profile set (security_invoker = true);
alter view public.teacher_subject_profile set (security_invoker = true);

-- Use these two functions for database-search selections and manual entries.
-- They replace only the subjects for the specified person/session and refresh
-- the profile cache.  Passing names to p_manual_subject_names is intentional:
-- each is made searchable in public.subject and marked MANUAL on the link.
create or replace function public.set_student_session_subjects(
  p_student_id text, p_session_id text, p_subject_ids text[] default '{}',
  p_manual_subject_names text[] default '{}'
) returns void language plpgsql security definer set search_path = public as $$
declare v_name text; v_subject_id text;
begin
  if not exists (select 1 from public.student where id = p_student_id) then
    raise exception 'Student not found';
  end if;
  if exists (select 1 from unnest(coalesce(p_subject_ids, '{}')) as selected(subject_id) left join public.subject s on s.id = selected.subject_id where s.id is null) then
    raise exception 'One or more selected subjects do not exist';
  end if;
  delete from public.student_session_subject where student_id = p_student_id and session_id is not distinct from p_session_id;
  insert into public.student_session_subject (student_id, session_id, subject_id, selection_source)
  select p_student_id, p_session_id, selected.subject_id, 'CATALOGUE'
  from unnest(coalesce(p_subject_ids, '{}')) as selected(subject_id)
  on conflict do nothing;
  foreach v_name in array coalesce(p_manual_subject_names, '{}') loop
    v_subject_id := public.find_or_create_subject(v_name, true);
    insert into public.student_session_subject (student_id, session_id, subject_id, selection_source)
    values (p_student_id, p_session_id, v_subject_id, 'MANUAL') on conflict do nothing;
  end loop;
  perform public.refresh_student_subject_cache(p_student_id);
end;
$$;

create or replace function public.set_teacher_subjects(
  p_teacher_id text, p_session_id text default null, p_subject_ids text[] default '{}',
  p_manual_subject_names text[] default '{}'
) returns void language plpgsql security definer set search_path = public as $$
declare v_name text; v_subject_id text;
begin
  if not exists (select 1 from public.teacher where id = p_teacher_id) then
    raise exception 'Teacher not found';
  end if;
  if exists (select 1 from unnest(coalesce(p_subject_ids, '{}')) as selected(subject_id) left join public.subject s on s.id = selected.subject_id where s.id is null) then
    raise exception 'One or more selected subjects do not exist';
  end if;
  delete from public.teacher_subject_registration where teacher_id = p_teacher_id and session_id is not distinct from p_session_id;
  insert into public.teacher_subject_registration (teacher_id, session_id, subject_id, selection_source)
  select p_teacher_id, p_session_id, selected.subject_id, 'CATALOGUE'
  from unnest(coalesce(p_subject_ids, '{}')) as selected(subject_id)
  on conflict do nothing;
  foreach v_name in array coalesce(p_manual_subject_names, '{}') loop
    v_subject_id := public.find_or_create_subject(v_name, true);
    insert into public.teacher_subject_registration (teacher_id, session_id, subject_id, selection_source)
    values (p_teacher_id, p_session_id, v_subject_id, 'MANUAL') on conflict do nothing;
  end loop;
  perform public.refresh_teacher_subject_cache(p_teacher_id);
end;
$$;

-- These write functions are intended for trusted server actions / the Supabase
-- service role.  Do not let an arbitrary signed-in user alter another person's
-- subject registration merely by calling an RPC with that person's ID.
revoke all on function public.find_or_create_subject(text, boolean) from public;
revoke all on function public.set_student_session_subjects(text, text, text[], text[]) from public;
revoke all on function public.set_teacher_subjects(text, text, text[], text[]) from public;
grant execute on function public.find_or_create_subject(text, boolean) to service_role;
grant execute on function public.set_student_session_subjects(text, text, text[], text[]) to service_role;
grant execute on function public.set_teacher_subjects(text, text, text[], text[]) to service_role;
