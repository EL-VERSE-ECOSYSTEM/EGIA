-- Non-destructive corrective migration for Supabase Postgres
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================================
-- 1. Correct updated-at trigger functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updatedat()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updatedat = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply only to tables that actually contain updatedat.
DO $$
DECLARE
  tbl_name text;
BEGIN
  FOREACH tbl_name IN ARRAY ARRAY[
    'school',
    'user',
    'parent',
    'teacher',
    'academic_session',
    'term',
    'class',
    'student',
    'assessment',
    'assessment_question',
    'payment',
    'payment_installment',
    'transactions',
    'conversation',
    'message',
    'notification',
    'teacher_wallet',
    'teacher_request',
    'report_card',
    'fee_structure'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tbl_name
        AND column_name = 'updatedat'
    ) THEN
      EXECUTE format(
        'DROP TRIGGER IF EXISTS %I ON public.%I',
        'set_updatedat_' || tbl_name,
        tbl_name
      );

      EXECUTE format(
        'CREATE TRIGGER %I
         BEFORE UPDATE ON public.%I
         FOR EACH ROW
         EXECUTE FUNCTION public.set_updatedat()',
        'set_updatedat_' || tbl_name,
        tbl_name
      );
    END IF;
  END LOOP;
END $$;

-- Apply only to tables that actually contain updated_at.
DO $$
DECLARE
  tbl_name text;
BEGIN
  FOREACH tbl_name IN ARRAY ARRAY[
    'user_fcm_tokens',
    'notification_history',
    'webhook_events',
    'payment_webhook_events',
    'transaction_ledger',
    'payment_receipt_uploads',
    'school_payment_config',
    'school_admin_roles',
    'adult_education_enrollments',
    'adult_education_classes',
    'teacher_attendance',
    'teacher_leave_requests',
    'teacher_leave_balance',
    'teacher_salary_deductions',
    'study_video',
    'library_books',
    'book_borrowings',
    'support_ticket_replies',
    'support_tickets',
    'dispute_messages',
    'disputes',
    'invitations',
    'audit_log'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = tbl_name
        AND column_name = 'updated_at'
    ) THEN
      EXECUTE format(
        'DROP TRIGGER IF EXISTS %I ON public.%I',
        'set_updated_at_' || tbl_name,
        tbl_name
      );

      EXECUTE format(
        'CREATE TRIGGER %I
         BEFORE UPDATE ON public.%I
         FOR EACH ROW
         EXECUTE FUNCTION public.set_updated_at()',
        'set_updated_at_' || tbl_name,
        tbl_name
      );
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 2. Required notification and webhook tables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL UNIQUE,
  table_name text NOT NULL,
  event_type text NOT NULL,
  record_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing','processed','failed')),
  error_message text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL UNIQUE,
  provider text NOT NULL DEFAULT 'KORAPAY',
  reference text,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'PROCESSING'
    CHECK (status IN ('PROCESSING','PROCESSED','FAILED')),
  attempts integer NOT NULL DEFAULT 0,
  error_message text,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  school_id text,
  event_key text,
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_at timestamptz NOT NULL DEFAULT now(),
  delivered boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  link text,
  metadata jsonb
);

ALTER TABLE public.notification_history ADD COLUMN IF NOT EXISTS event_key text;
ALTER TABLE public.notification_history ADD COLUMN IF NOT EXISTS school_id text;

CREATE UNIQUE INDEX IF NOT EXISTS notification_history_user_event_key_unique
ON public.notification_history(user_id, event_key)
WHERE event_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS notification_history_user_idx
ON public.notification_history(user_id, sent_at DESC);

-- ============================================================
-- 3. FCM device-token table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_fcm_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  token text NOT NULL UNIQUE,
  device_name varchar(255),
  device_type varchar(50) NOT NULL DEFAULT 'web',
  browser varchar(255),
  os varchar(100),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fcm_token_length_check
    CHECK (length(token) BETWEEN 20 AND 4096)
);

CREATE INDEX IF NOT EXISTS user_fcm_tokens_user_idx
ON public.user_fcm_tokens(user_id, is_active);

DELETE FROM public.user_fcm_tokens older
USING public.user_fcm_tokens newer
WHERE older.token = newer.token
  AND (
    older.updated_at < newer.updated_at
    OR (
      older.updated_at = newer.updated_at
      AND older.id < newer.id
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS user_fcm_tokens_token_unique
ON public.user_fcm_tokens(token);

-- ============================================================
-- 4. Invitation table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.invitations (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id text NOT NULL,
  email citext,
  phone text,
  role text NOT NULL CHECK (role IN ('TEACHER','PARENT','STUDENT')),
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING','ACCEPTED','EXPIRED','REVOKED')),
  expires_at timestamptz NOT NULL,
  invited_by text,
  accepted_by text,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. Audit log
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id text,
  school_id text,
  action text NOT NULL,
  resource text NOT NULL,
  resource_id text,
  before_state jsonb,
  after_state jsonb,
  details jsonb,
  ip_address inet,
  user_agent text,
  request_id text,
  createdat timestamptz NOT NULL DEFAULT now()
);

-- Add missing columns safely if audit_log table pre-existed with different column names
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_log' AND column_name = 'createdat'
  ) THEN
    CREATE INDEX IF NOT EXISTS audit_log_createdat_idx ON public.audit_log(createdat DESC);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_log' AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON public.audit_log(created_at DESC);
  END IF;
END $$;

-- ============================================================
-- 6. Storage buckets used by the application
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'school-logos',
    'school-logos',
    true,
    2097152,
    ARRAY['image/png','image/jpeg','image/webp','image/svg+xml']
  ),
  (
    'school-receipts',
    'school-receipts',
    false,
    5242880,
    ARRAY['image/png','image/jpeg','application/pdf']
  ),
  (
    'school-generated-receipts',
    'school-generated-receipts',
    false,
    10485760,
    ARRAY['application/pdf']
  ),
  (
    'lesson-notes',
    'lesson-notes',
    false,
    52428800,
    ARRAY['application/pdf']
  ),
  (
    'student-media',
    'student-media',
    false,
    52428800,
    ARRAY['image/png','image/jpeg','image/webp','video/webm','video/mp4']
  ),
  (
    'teacher-documents',
    'teacher-documents',
    false,
    10485760,
    ARRAY['application/pdf','image/png','image/jpeg']
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- 7. Storage policies
-- ============================================================

DROP POLICY IF EXISTS school_logos_public_read ON storage.objects;

CREATE POLICY school_logos_public_read
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'school-logos');

DROP POLICY IF EXISTS school_logos_authenticated_insert ON storage.objects;

CREATE POLICY school_logos_authenticated_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'school-logos'
  AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS school_logos_owner_update ON storage.objects;

CREATE POLICY school_logos_owner_update
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'school-logos'
  AND owner_id = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'school-logos'
  AND owner_id = auth.uid()::text
);

DROP POLICY IF EXISTS school_receipts_authenticated_insert ON storage.objects;

CREATE POLICY school_receipts_authenticated_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'school-receipts'
  AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS school_receipts_owner_read ON storage.objects;

CREATE POLICY school_receipts_owner_read
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'school-receipts'
  AND owner_id = auth.uid()::text
);

DROP POLICY IF EXISTS school_receipts_owner_delete ON storage.objects;

CREATE POLICY school_receipts_owner_delete
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'school-receipts'
  AND owner_id = auth.uid()::text
);

DROP POLICY IF EXISTS generated_receipts_service_access ON storage.objects;

CREATE POLICY generated_receipts_service_access
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'school-generated-receipts')
WITH CHECK (bucket_id = 'school-generated-receipts');

DROP POLICY IF EXISTS lesson_notes_authenticated_read ON storage.objects;

CREATE POLICY lesson_notes_authenticated_read
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'lesson-notes'
  AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS lesson_notes_authenticated_insert ON storage.objects;

CREATE POLICY lesson_notes_authenticated_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-notes'
  AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS lesson_notes_service_access ON storage.objects;

CREATE POLICY lesson_notes_service_access
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'lesson-notes')
WITH CHECK (bucket_id = 'lesson-notes');

DROP POLICY IF EXISTS student_media_authenticated_insert ON storage.objects;

CREATE POLICY student_media_authenticated_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('student-media','teacher-documents')
  AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS student_media_owner_read ON storage.objects;

CREATE POLICY student_media_owner_read
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id IN ('student-media','teacher-documents')
  AND owner_id = auth.uid()::text
);

DROP POLICY IF EXISTS student_media_service_access ON storage.objects;

CREATE POLICY student_media_service_access
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id IN ('student-media','teacher-documents'))
WITH CHECK (bucket_id IN ('student-media','teacher-documents'));

-- ============================================================
-- 8. RLS policies for application tables
-- ============================================================

ALTER TABLE IF EXISTS public.notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notification_history_owner_read ON public.notification_history;

CREATE POLICY notification_history_owner_read
ON public.notification_history
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS fcm_token_owner_read ON public.user_fcm_tokens;

CREATE POLICY fcm_token_owner_read
ON public.user_fcm_tokens
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS webhook_events_service_only ON public.webhook_events;

CREATE POLICY webhook_events_service_only
ON public.webhook_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS payment_webhook_events_service_only ON public.payment_webhook_events;

CREATE POLICY payment_webhook_events_service_only
ON public.payment_webhook_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS invitations_service_only ON public.invitations;

CREATE POLICY invitations_service_only
ON public.invitations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS audit_log_service_only ON public.audit_log;

CREATE POLICY audit_log_service_only
ON public.audit_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================
-- 9. Realtime publication
-- ============================================================

DO $$
DECLARE
  tbl_name text;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  FOREACH tbl_name IN ARRAY ARRAY[
    'school',
    'user',
    'student',
    'teacher',
    'parent',
    'assessment',
    'assessment_result',
    'payment',
    'message',
    'notification',
    'notification_history',
    'conversation',
    'conversation_participant',
    'teacher_attendance',
    'support_ticket',
    'dispute',
    'library_books',
    'cbt_sessions',
    'cbt_attempts'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = tbl_name
    ) THEN
      BEGIN
        EXECUTE format(
          'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',
          tbl_name
        );
      EXCEPTION
        WHEN duplicate_object THEN
          NULL;
      END;
    END IF;
  END LOOP;
END $$;

COMMIT;
