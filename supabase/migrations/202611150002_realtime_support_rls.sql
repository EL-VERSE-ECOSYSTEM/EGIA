CREATE OR REPLACE FUNCTION public.can_manage_realtime_school_record(owner_user_id text)
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
    JOIN public."user" AS owner ON owner.id = owner_user_id
    WHERE actor_role.userid = auth.uid()::text
      AND (
        actor_role.role = 'SUPER_ADMIN'
        OR (
          actor_role.role IN ('ADMIN', 'SCHOOL_ADMIN')
          AND actor.schoolid IS NOT NULL
          AND actor.schoolid = owner.schoolid
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_realtime_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_role
    WHERE userid = auth.uid()::text
      AND role = 'SUPER_ADMIN'
  );
$$;

REVOKE ALL ON FUNCTION public.can_manage_realtime_school_record(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_realtime_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_realtime_school_record(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_realtime_super_admin() TO authenticated;

ALTER TABLE public.support_ticket ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_message ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.support_ticket, public.support_ticket_replies, public.dispute, public.dispute_message TO authenticated;
REVOKE ALL ON public.support_ticket, public.support_ticket_replies, public.dispute, public.dispute_message FROM anon;

DROP POLICY IF EXISTS support_ticket_realtime_select ON public.support_ticket;
CREATE POLICY support_ticket_realtime_select ON public.support_ticket
FOR SELECT TO authenticated
USING (
  "userId" = auth.uid()::text
  OR public.is_realtime_super_admin()
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
      )
  )
);

DROP POLICY IF EXISTS dispute_realtime_select ON public.dispute;
CREATE POLICY dispute_realtime_select ON public.dispute
FOR SELECT TO authenticated
USING (
  "raisedById" = auth.uid()::text
  OR public.can_manage_realtime_school_record("raisedById")
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
        OR public.can_manage_realtime_school_record(parent_dispute."raisedById")
      )
  )
);

DO $$
DECLARE
  realtime_table text;
BEGIN
  FOREACH realtime_table IN ARRAY ARRAY['support_ticket_replies', 'dispute_message'] LOOP
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
