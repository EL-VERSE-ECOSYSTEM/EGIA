ALTER TABLE public.payment_installment
  ALTER COLUMN "paymentId" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS school_id text REFERENCES public.school(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS student_id text REFERENCES public.student(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS parent_id text REFERENCES public.parent(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS term_id text REFERENCES public.term(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS fee_type text,
  ADD COLUMN IF NOT EXISTS paid_amount numeric(12, 2) NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS payment_installment_term_plan_unique
  ON public.payment_installment (student_id, term_id, fee_type, "installmentNumber")
  WHERE student_id IS NOT NULL AND term_id IS NOT NULL AND fee_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS payment_installment_parent_due_date_idx
  ON public.payment_installment (parent_id, "dueDate");
