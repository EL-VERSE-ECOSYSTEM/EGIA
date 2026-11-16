DROP POLICY IF EXISTS school_registration_application_realtime_select
  ON public.school_registration_application;
DROP FUNCTION IF EXISTS public.can_read_school_registration_application_realtime();

CREATE FUNCTION public.can_read_school_registration_application_realtime(application_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    lower(coalesce(auth.jwt() ->> 'email', '')) <> ''
    AND (
      EXISTS (
        SELECT 1
        FROM public.user_role
        WHERE userid = auth.uid()::text
          AND upper(role) = 'SUPER_ADMIN'
      )
      OR lower(coalesce(application_email, '')) = lower(auth.jwt() ->> 'email')
    );
$$;

REVOKE ALL ON FUNCTION public.can_read_school_registration_application_realtime(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_school_registration_application_realtime(text) TO authenticated;

CREATE POLICY school_registration_application_realtime_select
  ON public.school_registration_application
  FOR SELECT TO authenticated
  USING (public.can_read_school_registration_application_realtime(applicant_email));
