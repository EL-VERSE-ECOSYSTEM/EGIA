# Payments and live deployment checks

## Required configuration

- `PAYSTACK_SECRET_KEY`: keep server-side only. Use the test key outside production and the live key only in production.
- `NEXT_SITE_URL` or `NEXT_PUBLIC_SITE_URL`: set to the canonical HTTPS app origin in production. Paystack callbacks are restricted to this origin.
- Supabase server credentials and database URL: configure through the deployment secret store. Never expose the service role key to browser code.
- Learn AI additionally needs `GROQ_API_KEY` (or the supported `GROQ_AI_API` fallback). AI can be disabled with the `disable_ai` feature flag.

## Paystack dashboard setup

1. Set the Paystack webhook URL to `https://<canonical-app-origin>/api/webhooks/paystack`.
2. Enable the `charge.success` and `charge.failed` events.
3. Confirm the production key belongs to the same Paystack account and currency configuration as the intended settlement account. The current fee flows validate `NGN`.
4. Confirm transaction initialization sends callback URLs on the canonical deployment origin; redirects to a different origin are rejected.

## Supabase setup

1. Apply the SQL migrations in `supabase/migrations/`, including `202611080001_learn_ai_tokens.sql`, before enabling Learn AI purchases.
2. Keep Row Level Security enabled on the Learn AI token tables. Their service-role functions must remain unavailable to `anon` and `authenticated` roles.
3. If dashboard live refresh is required, enable Supabase Realtime for the tables consumed by the role-specific subscriptions and retain the polling fallback.
4. Apply `202611120002_secure_payment_receipts.sql` before enabling manual transfer receipts; receipt metadata is server-written and file uploads are scoped to the signed-in parent's linked student.

## Release checks requiring external credentials

- Verify Paystack test-mode checkout end to end with a disposable test payment: initialization, redirect, callback, webhook, database status, and exactly-once fulfillment. Do not use a real card or create a live charge for routine checks.
- In the Paystack dashboard, confirm webhook delivery and successful signature verification after deployment. A successful bank-list API request only verifies credentials and connectivity; it does not prove settlement or webhook delivery.
- After applying Supabase migrations, check one Learn AI token checkout in test mode and confirm that duplicate callbacks/webhooks do not duplicate token lots.
- Confirm the running deployment has the expected server-only secrets and canonical URL; repository-local environment files are not a substitute for deployment configuration.
