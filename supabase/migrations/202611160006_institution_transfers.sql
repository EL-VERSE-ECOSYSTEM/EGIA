CREATE TABLE IF NOT EXISTS public.institution_transfer_request (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  role text NOT NULL,
  old_school_id text REFERENCES public.school(id) ON DELETE SET NULL,
  new_school_id text NOT NULL REFERENCES public.school(id) ON DELETE CASCADE,
  ward_student_id text REFERENCES public.student(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'PENDING',
  approved_at timestamptz,
  cleanup_after timestamptz,
  cleaned_at timestamptz,
  reviewed_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS institution_transfer_pending_idx
  ON public.institution_transfer_request(new_school_id, status, created_at);
ALTER TABLE public.institution_transfer_request ENABLE ROW LEVEL SECURITY;
