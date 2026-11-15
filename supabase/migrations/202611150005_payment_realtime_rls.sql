CREATE OR REPLACE FUNCTION public.can_realtime_manage_school_id(target_school_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_role AS actor_role
    JOIN public."user" AS actor ON actor.id = actor_role.userid
    WHERE actor_role.userid = auth.uid()::text
      AND (
        actor_role.role = 'SUPER_ADMIN'
        OR (
          actor_role.role IN ('ADMIN', 'SCHOOL_ADMIN')
          AND target_school_id IS NOT NULL
          AND actor.schoolid = target_school_id
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_realtime_manage_school_id(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_realtime_manage_school_id(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_read_realtime_student_payment(
  target_student_id text,
  target_parent_id text,
  target_school_id text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.student AS learner
      LEFT JOIN public.parent AS guardian
        ON guardian.id = learner.parentid
        AND guardian.schoolid = learner.schoolid
      WHERE learner.id = target_student_id
        AND learner.schoolid = target_school_id
        AND (target_parent_id IS NULL OR learner.parentid = target_parent_id)
        AND (
          learner.userid = auth.uid()::text
          OR guardian.userid = auth.uid()::text
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.parent AS linked_parent
      JOIN public.student AS linked_student
        ON linked_student.parentid = linked_parent.id
        AND linked_student.schoolid = linked_parent.schoolid
      WHERE linked_parent.id = target_parent_id
        AND linked_parent.userid = auth.uid()::text
        AND linked_student.id = target_student_id
        AND linked_student.schoolid = target_school_id
    )
    OR public.can_realtime_manage_school_id(target_school_id);
$$;

REVOKE ALL ON FUNCTION public.can_read_realtime_student_payment(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_realtime_student_payment(text, text, text) TO authenticated;

DO $$
DECLARE
  existing_policy record;
BEGIN
  FOR existing_policy IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('payment', 'payment_installment', 'notification')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', existing_policy.policyname, existing_policy.tablename);
  END LOOP;
END $$;

ALTER TABLE public.payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_installment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.payment, public.payment_installment, public.notification FROM anon;
GRANT SELECT ON public.payment, public.payment_installment, public.notification TO authenticated;

CREATE POLICY payment_realtime_select ON public.payment
FOR SELECT TO authenticated
USING (public.can_read_realtime_student_payment(payment.studentid, payment.parentid, payment.schoolid));

CREATE POLICY payment_installment_realtime_select ON public.payment_installment
FOR SELECT TO authenticated
USING (public.can_read_realtime_student_payment(student_id, parent_id, school_id));

CREATE POLICY notification_realtime_select ON public.notification
FOR SELECT TO authenticated
USING ("userId" = auth.uid()::text);

DO $$
DECLARE
  realtime_table text;
BEGIN
  FOREACH realtime_table IN ARRAY ARRAY['payment', 'payment_installment', 'notification'] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', realtime_table);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END $$;
