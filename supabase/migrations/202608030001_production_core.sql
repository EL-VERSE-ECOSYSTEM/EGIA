-- Production-safe additive migration for an existing EGIA Supabase database.
-- Run this in the Supabase SQL editor; it does not drop existing data.

create table if not exists public.study_video (
  id text primary key,
  title text not null check (length(trim(title)) > 0),
  description text not null check (length(trim(description)) > 0),
  subject text not null,
  class_name text not null,
  video_url text not null check (video_url ~ '^https?://'),
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  teacher_id text not null references public.teacher(id) on delete cascade,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.study_video_question (
  id text primary key,
  video_id text not null references public.study_video(id) on delete cascade,
  student_id text not null references public.student(id) on delete cascade,
  content text not null check (length(trim(content)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.study_video_reply (
  id text primary key,
  question_id text not null references public.study_video_question(id) on delete cascade,
  teacher_id text not null references public.teacher(id) on delete cascade,
  content text not null check (length(trim(content)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists study_video_class_published_idx on public.study_video (class_name, is_published, created_at desc);
create index if not exists study_video_teacher_idx on public.study_video (teacher_id, created_at desc);
create index if not exists study_video_question_video_idx on public.study_video_question (video_id, created_at desc);

alter table public.student drop constraint if exists student_admission_number_format;
alter table public.student add constraint student_admission_number_format check (
  admissionnumber is null or admissionnumber ~ '^EGIA-(S|P)-[0-9]{6}$'
);
alter table public.teacher drop constraint if exists teacher_staff_code_format;
alter table public.teacher add constraint teacher_staff_code_format check (
  staffcode is null or staffcode ~ '^EGIA-ST-[0-9]{6}$'
);

-- Registration source is explicit: imported/admin admissions remain free, while
-- self-service registrations are held until a verified Korapay webhook succeeds.
alter table public.student add column if not exists registrationstatus text not null default 'WAIVED';
alter table public.student drop constraint if exists student_registration_status_valid;
alter table public.student add constraint student_registration_status_valid check (registrationstatus in ('WAIVED', 'PENDING_PAYMENT', 'ACTIVE'));

-- Existing records are school-created/imported unless a pending registration
-- payment already exists. This is safe to run repeatedly.
update public.student s
set registrationstatus = case when exists (
  select 1 from public.payment p
  where p.studentid = s.id and p.feetype = 'registration' and lower(coalesce(p.status, '')) = 'pending'
) then 'PENDING_PAYMENT' else 'WAIVED' end
where registrationstatus is null or registrationstatus = 'WAIVED';

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

alter table public.study_video enable row level security;
alter table public.study_video_question enable row level security;
alter table public.study_video_reply enable row level security;
-- The application uses server-side database access. Add organization-specific
-- browser RLS policies only if clients will access these tables directly.
