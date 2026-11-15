CREATE OR REPLACE FUNCTION public.can_manage_realtime_dispute(
  raiser_user_id text,
  related_student_id text,
  related_payment_id text
)
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
          AND actor.schoolid IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public."user" AS raiser
            WHERE raiser.id = raiser_user_id
              AND (raiser.schoolid IS NULL OR raiser.schoolid = actor.schoolid)
          )
          AND (
            related_student_id IS NULL
            OR EXISTS (
              SELECT 1 FROM public.student AS learner
              WHERE learner.id = related_student_id
                AND learner.schoolid = actor.schoolid
            )
          )
          AND (
            related_payment_id IS NULL
            OR EXISTS (
              SELECT 1 FROM public.payment AS payment_record
              WHERE payment_record.id = related_payment_id
                AND payment_record.schoolid = actor.schoolid
            )
          )
          AND (
            EXISTS (
              SELECT 1 FROM public."user" AS raiser
              WHERE raiser.id = raiser_user_id
                AND raiser.schoolid = actor.schoolid
            )
            OR related_student_id IS NOT NULL
            OR related_payment_id IS NOT NULL
          )
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_manage_realtime_dispute(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_realtime_dispute(text, text, text) TO authenticated;

DROP POLICY IF EXISTS support_ticket_realtime_select ON public.support_ticket;
CREATE POLICY support_ticket_realtime_select ON public.support_ticket
FOR SELECT TO authenticated
USING (
  "userId" = auth.uid()::text
  OR public.is_realtime_super_admin()
  OR ("userId" IS NOT NULL AND public.can_manage_realtime_school_record("userId"))
);

DROP POLICY IF EXISTS support_replies_realtime_select ON public.support_ticket_replies;
CREATE POLICY support_replies_realtime_select ON public.support_ticket_replies
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.support_ticket AS ticket
    WHERE ticket.id = support_ticket_replies.ticket_id
      AND (
        ticket."userId" = auth.uid()::text
        OR public.is_realtime_super_admin()
        OR (ticket."userId" IS NOT NULL AND public.can_manage_realtime_school_record(ticket."userId"))
      )
  )
);

DROP POLICY IF EXISTS dispute_realtime_select ON public.dispute;
CREATE POLICY dispute_realtime_select ON public.dispute
FOR SELECT TO authenticated
USING (
  "raisedById" = auth.uid()::text
  OR public.can_manage_realtime_dispute("raisedById", "relatedStudentId", "relatedPaymentId")
);

DROP POLICY IF EXISTS dispute_message_realtime_select ON public.dispute_message;
CREATE POLICY dispute_message_realtime_select ON public.dispute_message
FOR SELECT TO authenticated
USING (
  (COALESCE("isInternal", false) = false OR public.is_realtime_super_admin())
  AND EXISTS (
    SELECT 1
    FROM public.dispute AS parent_dispute
    WHERE parent_dispute.id = dispute_message."disputeId"
      AND (
        parent_dispute."raisedById" = auth.uid()::text
        OR public.can_manage_realtime_dispute(
          parent_dispute."raisedById",
          parent_dispute."relatedStudentId",
          parent_dispute."relatedPaymentId"
        )
      )
  )
);

DO $$
DECLARE
  realtime_table text;
BEGIN
  FOREACH realtime_table IN ARRAY ARRAY[
    'support_ticket',
    'support_ticket_replies',
    'dispute',
    'dispute_message'
  ] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND tables.table_name = realtime_table
    ) THEN
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', realtime_table);
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END;
    END IF;
  END LOOP;
END $$;
