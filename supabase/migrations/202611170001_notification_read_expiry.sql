CREATE INDEX IF NOT EXISTS notification_history_read_expiry_idx
  ON public.notification_history (read_at)
  WHERE read_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.delete_expired_read_notifications()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count bigint;
BEGIN
  DELETE FROM public.notification_history
  WHERE read_at IS NOT NULL
    AND read_at < now() - interval '72 hours';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Supabase projects commonly include pg_cron. Keep lazy expiry in the API as a
-- fallback for installations where the scheduler extension is unavailable.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'delete-expired-read-notifications',
      '*/15 * * * *',
      'SELECT public.delete_expired_read_notifications()'
    );
  END IF;
END;
$$;
