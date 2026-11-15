CREATE TABLE IF NOT EXISTS public.fee_reminder_claim (
  user_id text NOT NULL,
  student_id text NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, student_id)
);

REVOKE ALL ON public.fee_reminder_claim FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_fee_reminder(p_user_id text, p_student_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_claimed boolean := false;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id || ':' || p_student_id, 0));

  IF EXISTS (
    SELECT 1
    FROM public.notification_history
    WHERE user_id = p_user_id
      AND type = 'payment_reminder'
      AND sent_at > now() - interval '24 hours'
      AND data ->> 'studentId' = p_student_id
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.fee_reminder_claim (user_id, student_id, claimed_at)
  VALUES (p_user_id, p_student_id, now())
  ON CONFLICT (user_id, student_id)
  DO UPDATE SET claimed_at = EXCLUDED.claimed_at
  WHERE public.fee_reminder_claim.claimed_at <= now() - interval '24 hours'
  RETURNING true INTO v_claimed;

  RETURN COALESCE(v_claimed, false);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_fee_reminder(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_fee_reminder(text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.release_fee_reminder_claim(p_user_id text, p_student_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  DELETE FROM public.fee_reminder_claim
  WHERE user_id = p_user_id AND student_id = p_student_id;
$$;

REVOKE ALL ON FUNCTION public.release_fee_reminder_claim(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_fee_reminder_claim(text, text) TO service_role;
