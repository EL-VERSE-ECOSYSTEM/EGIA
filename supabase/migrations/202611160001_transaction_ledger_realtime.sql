ALTER TABLE public.transaction_ledger ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.transaction_ledger FROM anon;
GRANT SELECT ON public.transaction_ledger TO authenticated;

DROP POLICY IF EXISTS transaction_ledger_realtime_select ON public.transaction_ledger;
CREATE POLICY transaction_ledger_realtime_select ON public.transaction_ledger
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()::text
    OR public.can_read_realtime_student_payment(student_id, NULL, schoolid)
    OR public.can_realtime_manage_school_id(schoolid)
);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.transaction_ledger;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;