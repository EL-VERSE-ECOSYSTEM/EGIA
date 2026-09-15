-- 1. ADD SCHEDULED DATE AND TIME TO ASSESSMENT TABLE
ALTER TABLE public.assessment
  ADD COLUMN IF NOT EXISTS scheduled_date text,
  ADD COLUMN IF NOT EXISTS scheduled_time text;

-- 2. CREATE STUDENT GIFTS TABLE
CREATE TABLE IF NOT EXISTS public.student_gifts (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  schoolid text REFERENCES public.school(id) ON DELETE SET NULL,
  student_id text NOT NULL REFERENCES public.student(id) ON DELETE CASCADE,
  title text NOT NULL,
  reason text,
  amount numeric(12,2) NOT NULL DEFAULT 0.00,
  gift_type text NOT NULL DEFAULT 'CASH_OR_FEE',
  status text NOT NULL DEFAULT 'AVAILABLE',
  received_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast queries by student and status
CREATE INDEX IF NOT EXISTS idx_student_gifts_student_id ON public.student_gifts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_gifts_status ON public.student_gifts(status);

-- Enable RLS on student_gifts
ALTER TABLE public.student_gifts ENABLE ROW LEVEL SECURITY;

-- Select policy: Students see their own gifts, admins see gifts in their school
DROP POLICY IF EXISTS student_gifts_select ON public.student_gifts;
CREATE POLICY student_gifts_select ON public.student_gifts
FOR SELECT USING (
  student_id IN (SELECT id FROM public.student WHERE userid = (auth.jwt() ->> 'sub'))
  OR schoolid = (auth.jwt() ->> 'school_id')
  OR (auth.jwt() ->> 'role') = 'SUPER_ADMIN'
);

-- Insert/Update policy: Only school admins or super admins
DROP POLICY IF EXISTS student_gifts_write ON public.student_gifts;
CREATE POLICY student_gifts_write ON public.student_gifts
FOR ALL USING (
  schoolid = (auth.jwt() ->> 'school_id')
  OR (auth.jwt() ->> 'role') = 'SUPER_ADMIN'
);

-- Add student_gifts to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_gifts;
