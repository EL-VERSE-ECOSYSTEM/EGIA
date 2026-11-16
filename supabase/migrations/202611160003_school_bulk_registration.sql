CREATE TABLE IF NOT EXISTS public.school_registration_batches (
  id text PRIMARY KEY,
  school_id text NOT NULL REFERENCES public.school(id) ON DELETE CASCADE,
  created_by text NOT NULL REFERENCES public."user"(id) ON DELETE RESTRICT,
  payment_reference text NOT NULL UNIQUE,
  student_ids jsonb NOT NULL CHECK (jsonb_typeof(student_ids) = 'array'),
  student_count integer NOT NULL CHECK (student_count > 0),
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS school_registration_batches_school_created_idx
  ON public.school_registration_batches (school_id, created_at DESC);

ALTER TABLE public.school_registration_batches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.school_registration_batches FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.can_read_school_registration_application_realtime()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_role
    WHERE userid = auth.uid()::text
      AND upper(role) = 'SUPER_ADMIN'
  );
$$;

REVOKE ALL ON FUNCTION public.can_read_school_registration_application_realtime() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_school_registration_application_realtime() TO authenticated;

ALTER TABLE public.school_registration_application ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.school_registration_application FROM anon;
GRANT SELECT ON public.school_registration_application TO authenticated;

DROP POLICY IF EXISTS school_registration_application_realtime_select
  ON public.school_registration_application;
CREATE POLICY school_registration_application_realtime_select
  ON public.school_registration_application
  FOR SELECT TO authenticated
  USING (public.can_read_school_registration_application_realtime());

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.school_registration_application;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
