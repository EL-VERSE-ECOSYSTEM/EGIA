ALTER TABLE public."user"
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

ALTER TABLE public.school_registration_application
  ADD COLUMN IF NOT EXISTS payment_otp_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_otp_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS approval_email_sent_at timestamptz;
