ALTER TABLE public.assessment
  ADD COLUMN IF NOT EXISTS target_class_id text REFERENCES public."class"(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_department text;

ALTER TABLE public.support_ticket
  ALTER COLUMN "userId" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_email text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'support_ticket_contact_identity_check'
      AND conrelid = 'public.support_ticket'::regclass
  ) THEN
    ALTER TABLE public.support_ticket
      ADD CONSTRAINT support_ticket_contact_identity_check
      CHECK ("userId" IS NOT NULL OR (contact_name IS NOT NULL AND contact_email IS NOT NULL));
  END IF;
END $$;
