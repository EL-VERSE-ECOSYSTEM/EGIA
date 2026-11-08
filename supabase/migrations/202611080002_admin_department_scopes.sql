alter table public.teacher
  add column if not exists department text;

create index if not exists teacher_school_department_idx
  on public.teacher (schoolid, department);