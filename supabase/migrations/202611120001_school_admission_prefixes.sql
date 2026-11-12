-- Allow the app's four-letter per-school IDs while preserving existing learner IDs.
alter table public.student drop constraint if exists student_admission_number_format;
alter table public.student add constraint student_admission_number_format check (
  admissionnumber is null or admissionnumber ~ '^[A-Z]{4}-(S|P)-[0-9]{6}$'
);

alter table public.teacher drop constraint if exists teacher_staff_code_format;
alter table public.teacher add constraint teacher_staff_code_format check (
  staffcode is null or staffcode ~ '^[A-Z]{4}-ST-[0-9]{6}$'
);
