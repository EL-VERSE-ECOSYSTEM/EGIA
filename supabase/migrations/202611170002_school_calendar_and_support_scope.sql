ALTER TABLE public.support_ticket
  ADD COLUMN IF NOT EXISTS school_id text REFERENCES public.school(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS support_type text NOT NULL DEFAULT 'APP',
  ADD COLUMN IF NOT EXISTS escalated_to_super_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by text REFERENCES public."user"(id) ON DELETE SET NULL;

UPDATE public.support_ticket AS ticket
SET school_id = app_user.schoolid
FROM public."user" AS app_user
WHERE ticket."userId" = app_user.id AND ticket.school_id IS NULL;

CREATE INDEX IF NOT EXISTS support_ticket_school_scope_idx
  ON public.support_ticket (school_id, support_type, status, "createdAt" DESC);

CREATE TABLE IF NOT EXISTS public.school_calendar_event (
  id text PRIMARY KEY,
  school_id text NOT NULL REFERENCES public.school(id) ON DELETE CASCADE,
  term_id text REFERENCES public.term(id) ON DELETE SET NULL,
  session_id text REFERENCES public.academic_session(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'ACTIVITY',
  event_date date NOT NULL,
  start_time time,
  end_time time,
  location text,
  created_by text NOT NULL REFERENCES public."user"(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT school_calendar_event_time_check CHECK (end_time IS NULL OR start_time IS NULL OR end_time >= start_time)
);

CREATE INDEX IF NOT EXISTS school_calendar_event_school_date_idx
  ON public.school_calendar_event (school_id, event_date, start_time);

ALTER TABLE public.school_calendar_event ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS school_calendar_event_school_read ON public.school_calendar_event;
CREATE POLICY school_calendar_event_school_read ON public.school_calendar_event
  FOR SELECT TO authenticated USING (
    school_id IN (
      SELECT schoolid FROM public."user" WHERE id::text = auth.uid()::text
    ) OR EXISTS (
      SELECT 1 FROM public.student s WHERE s.schoolid::text = school_calendar_event.school_id
        AND s.userid::text = auth.uid()::text
    ) OR EXISTS (
      SELECT 1 FROM public.parent p JOIN public.student s ON s.parentid::text = p.id::text
      WHERE p.userid::text = auth.uid()::text AND s.schoolid::text = school_calendar_event.school_id
    ) OR EXISTS (
      SELECT 1 FROM public.teacher t WHERE t.schoolid::text = school_calendar_event.school_id
        AND t.userid::text = auth.uid()::text
    )
  );
DROP POLICY IF EXISTS school_calendar_event_school_admin_write ON public.school_calendar_event;
CREATE POLICY school_calendar_event_school_admin_write ON public.school_calendar_event
  FOR ALL TO authenticated USING (
    school_id IN (SELECT app_user.schoolid FROM public."user" app_user
      WHERE app_user.id::text = auth.uid()::text AND EXISTS (
        SELECT 1 FROM public.user_role role_row WHERE role_row.userid = app_user.id
          AND upper(role_row.role) IN ('ADMIN', 'SCHOOL_ADMIN')
      ))
  ) WITH CHECK (
    school_id IN (SELECT app_user.schoolid FROM public."user" app_user
      WHERE app_user.id::text = auth.uid()::text AND EXISTS (
        SELECT 1 FROM public.user_role role_row WHERE role_row.userid = app_user.id
          AND upper(role_row.role) IN ('ADMIN', 'SCHOOL_ADMIN')
      ))
  );

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.school_calendar_event;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
