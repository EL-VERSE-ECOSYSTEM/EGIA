BEGIN;

CREATE TABLE IF NOT EXISTS public.payment_webhook_logs (
  id text PRIMARY KEY,
  reference text NOT NULL,
  event_type text NOT NULL,
  payload jsonb,
  status text NOT NULL DEFAULT 'PROCESSED',
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF to_regclass('public.payment') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'payment' AND column_name = 'korapayreference'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'payment' AND column_name = 'paystackreference'
      ) THEN
        ALTER TABLE public.payment RENAME COLUMN korapayreference TO paystackreference;
      ELSE
        UPDATE public.payment
        SET paystackreference = COALESCE(paystackreference, korapayreference)
        WHERE korapayreference IS NOT NULL;
        ALTER TABLE public.payment DROP COLUMN korapayreference;
        CREATE UNIQUE INDEX IF NOT EXISTS payment_paystackreference_unique
          ON public.payment (paystackreference);
      END IF;
    ELSIF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'payment' AND column_name = 'paystackreference'
    ) THEN
      ALTER TABLE public.payment ADD COLUMN paystackreference text UNIQUE;
    END IF;

    UPDATE public.payment
    SET paymentmethod = 'PAYSTACK'
    WHERE upper(paymentmethod) LIKE '%KORAPAY%';
  END IF;

  IF to_regclass('public.school_payment_config') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'school_payment_config' AND column_name = 'use_korapay'
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'school_payment_config' AND column_name = 'use_paystack'
      ) THEN
        ALTER TABLE public.school_payment_config RENAME COLUMN use_korapay TO use_paystack;
      ELSE
        UPDATE public.school_payment_config SET use_paystack = use_korapay;
        ALTER TABLE public.school_payment_config DROP COLUMN use_korapay;
      END IF;
    ELSIF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'school_payment_config' AND column_name = 'use_paystack'
    ) THEN
      ALTER TABLE public.school_payment_config
        ADD COLUMN use_paystack boolean NOT NULL DEFAULT true;
    END IF;

    ALTER TABLE public.school_payment_config
      DROP CONSTRAINT IF EXISTS bank_required_if_not_korapay;
    ALTER TABLE public.school_payment_config
      DROP CONSTRAINT IF EXISTS bank_required_if_not_paystack;
    ALTER TABLE public.school_payment_config
      ADD CONSTRAINT bank_required_if_not_paystack CHECK (
        use_paystack = true OR (
          use_paystack = false AND account_number IS NOT NULL AND account_name IS NOT NULL
        )
      );
  END IF;

  IF to_regclass('public.transaction_ledger') IS NOT NULL THEN
    ALTER TABLE public.transaction_ledger
      DROP CONSTRAINT IF EXISTS transaction_ledger_confirmation_method_check;
    UPDATE public.transaction_ledger
    SET confirmation_method = 'PAYSTACK_AUTO'
    WHERE confirmation_method = 'KORAPAY_AUTO';
    ALTER TABLE public.transaction_ledger
      ADD CONSTRAINT transaction_ledger_confirmation_method_check
      CHECK (confirmation_method IN ('PAYSTACK_AUTO', 'MANUAL_UPLOAD', 'SCHOOL_ACCOUNT'));
    UPDATE public.transaction_ledger
    SET gateway = 'PAYSTACK'
    WHERE lower(gateway) LIKE '%korapay%';
  END IF;

  IF to_regclass('public.payment_webhook_events') IS NOT NULL THEN
    UPDATE public.payment_webhook_events
    SET provider = 'PAYSTACK'
    WHERE upper(provider) = 'KORAPAY';
    ALTER TABLE public.payment_webhook_events
      ALTER COLUMN provider SET DEFAULT 'PAYSTACK';
  END IF;

  IF to_regclass('public.system_incidents') IS NOT NULL THEN
    UPDATE public.system_incidents SET service = 'paystack' WHERE lower(service) = 'korapay';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS payment_webhook_logs_reference_event_idx
  ON public.payment_webhook_logs (reference, event_type);

COMMIT;
