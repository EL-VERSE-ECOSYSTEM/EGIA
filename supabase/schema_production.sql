-- EGIA production subject, profile and visibility SQL.
-- Run after schema_complete.sql, or apply the equivalent statements in Supabase SQL Editor.
-- This script is additive and safe to run repeatedly.

create extension if not exists pgcrypto;

-- Canonical subject catalogue used by Session Registration. Learners may also
-- enter a subject manually; manual values are retained in student.subjectsdone.
create table if not exists public.subject (
  id text primary key,
  name text not null,
  code text unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists subject_name_lower_unique on public.subject (lower(trim(name)));
alter table public.subject add column if not exists is_active boolean not null default true;
alter table public.subject add column if not exists created_at timestamptz not null default now();
alter table public.subject add column if not exists updated_at timestamptz not null default now();

alter table public.student add column if not exists subjectsdone jsonb;
alter table public.teacher add column if not exists teachingsubjects jsonb;
alter table public.teacher add column if not exists handlingclasses jsonb;
alter table public.teacher add column if not exists isclassteacher boolean not null default false;
alter table public.teacher add column if not exists assignedclassid text;

alter table public.student drop constraint if exists student_subjectsdone_array;
alter table public.student add constraint student_subjectsdone_array check (subjectsdone is null or jsonb_typeof(subjectsdone) = 'array');
alter table public.teacher drop constraint if exists teacher_teachingsubjects_array;
alter table public.teacher add constraint teacher_teachingsubjects_array check (teachingsubjects is null or jsonb_typeof(teachingsubjects) = 'array');
alter table public.teacher drop constraint if exists teacher_handlingclasses_array;
alter table public.teacher add constraint teacher_handlingclasses_array check (handlingclasses is null or jsonb_typeof(handlingclasses) = 'array');

create index if not exists student_subjectsdone_gin_idx on public.student using gin (subjectsdone);
create index if not exists teacher_teachingsubjects_gin_idx on public.teacher using gin (teachingsubjects);
create index if not exists student_class_idx on public.student (class);
create index if not exists teacher_assignedclass_idx on public.teacher (assignedclassid);

-- A normalized reporting view for admin/teacher dashboards. It keeps the
-- original JSON record authoritative while exposing one row per learner subject.
create or replace view public.student_subject_profile as
select s.id as student_id,
       s.admissionnumber,
       s.firstname,
       s.lastname,
       s.class,
       trim(value #>> '{}') as subject_name
from public.student s
cross join lateral jsonb_array_elements(coalesce(s.subjectsdone, '[]'::jsonb)) value
where trim(value #>> '{}') <> '';

-- One row per teacher subject for reporting and assignment checks.
create or replace view public.teacher_subject_profile as
select t.id as teacher_id,
       t.staffcode,
       t.firstname,
       t.lastname,
       trim(value #>> '{}') as subject_name
from public.teacher t
cross join lateral jsonb_array_elements(coalesce(t.teachingsubjects, '[]'::jsonb)) value
where trim(value #>> '{}') <> '';

-- Maximum five wards per parent, enforced for every insert/update path.
create or replace function public.enforce_parent_ward_limit()
returns trigger language plpgsql as $$
begin
  if new.parentid is not null and (tg_op = 'INSERT' or new.parentid is distinct from old.parentid) then
    if (select count(*) from public.student where parentid = new.parentid and id <> new.id) >= 5 then
      raise exception 'A parent may be linked to at most five wards';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists enforce_parent_ward_limit_trigger on public.student;
create trigger enforce_parent_ward_limit_trigger before insert or update of parentid on public.student
for each row execute function public.enforce_parent_ward_limit();

-- RLS is enabled for browser-safe catalogue reads. Profile and payment writes
-- continue through server actions using the service/database connection.
alter table public.subject enable row level security;
drop policy if exists subject_catalogue_read on public.subject;
create policy subject_catalogue_read on public.subject for select using (is_active = true);

insert into public.subject (id, name, code)
values
  (gen_random_uuid()::text, 'Mathematics', 'MATH'),
  (gen_random_uuid()::text, 'English Language', 'ENG'),
  (gen_random_uuid()::text, 'Basic Science', 'BSC')
on conflict (lower(trim(name))) do nothing;
