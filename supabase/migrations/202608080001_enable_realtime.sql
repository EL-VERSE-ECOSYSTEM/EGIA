-- Enable Postgres Changes for the live school-management surfaces.
-- Safe to re-run: tables absent from a deployment are skipped and tables that
-- are already members of the publication are ignored.
do $$
declare
  realtime_table text;
begin
  foreach realtime_table in array array[
    'user', 'student', 'teacher', 'parent', 'assessment', 'assessment_result',
    'payment', 'message', 'notification', 'book', 'attendance_record',
    'dispute', 'support_ticket', 'fee_structure', 'cbt_attempt', 'book_borrowing',
    'conversation', 'conversation_participant'
  ] loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and tables.table_name = realtime_table
    ) then
      begin
        execute format('alter publication supabase_realtime add table public.%I', realtime_table);
      exception when duplicate_object then
        null;
      end;
    end if;
  end loop;
end $$;
