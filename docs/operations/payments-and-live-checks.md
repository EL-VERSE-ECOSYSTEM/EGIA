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
5. Apply `202611150001_assessment_targets_and_support_contacts.sql`, `202611150002_realtime_support_rls.sql`, `202611150003_atomic_fee_reminder_claims.sql`, `202611150004_parent_term_installments.sql`, and `202611150005_payment_realtime_rls.sql` before deploying the matching application code. Realtime policies grant authenticated SELECT only for the linked learner/parent, the learner's school administrators, or Super Admin.

## Manual and installment fee payments

- School `ADMIN` and primary school administrators can record in-person cash, bank transfer, POS, cheque, or other receipts. Each save creates a distinct successful payment ledger entry; do not combine or overwrite earlier partial receipts.
- Parent installment plans are scoped to a linked student and assigned term. The remaining active fee balance is split into 18 kobo-accurate installments, due dates are spread across the term, and Paystack's processing fee is added to each checkout.
- In-school receipts and successful full-balance Paystack payments are applied oldest-first to any existing installment plan, including partial installments, to avoid showing already-paid fees as still due.
- Applying migrations `202611150004` and `202611150005` is required before using installment plans or realtime payment refresh. The RLS migration replaces client read policies on `payment`, `payment_installment`, and `notification`; browser writes remain denied.
- Verify that the parent and student Supabase Auth UUIDs match the corresponding `user.id` values, that `student.termId` points at the intended active term, and that every linked student has an active fee structure before enabling the installment portal.
- Successful manual and Paystack payments create in-app notification rows and attempt FCM push to the student and linked parent. Confirm FCM credentials and device tokens in staging; delivery failures are logged separately and do not roll back a confirmed payment.

## CBT fee eligibility and reminders

- CBT access is gated at 75% of the active class/department fee schedule. Only payment rows for that student and school in `success`, `approved`, or `cleared` status count toward the threshold.
- Fee clearance is enforced by server actions as well as shown in the student CBT portal; hiding or disabling a client-side button is not the security control.
- Student and linked-parent push/in-app reminders are deduplicated to once per 24 hours when the parent dashboard or student CBT clearance is checked. Ensure FCM credentials and device subscriptions are configured for push delivery.
- Vercel runs `/api/cron/fee-reminders` daily at 08:00 UTC. Set a high-entropy `CRON_SECRET` in the deployment environment; the route rejects requests without its matching Bearer token. Configure the same secret in Vercel and verify the scheduled invocation and response counts after deployment.

## Release checks requiring external credentials

- Verify Paystack test-mode checkout end to end with a disposable test payment: initialization, redirect, callback, webhook, database status, and exactly-once fulfillment. Do not use a real card or create a live charge for routine checks.
- In the Paystack dashboard, confirm webhook delivery and successful signature verification after deployment. A successful bank-list API request only verifies credentials and connectivity; it does not prove settlement or webhook delivery.
- After applying Supabase migrations, check one Learn AI token checkout in test mode and confirm that duplicate callbacks/webhooks do not duplicate token lots.
- Confirm the running deployment has the expected server-only secrets and canonical URL; repository-local environment files are not a substitute for deployment configuration.
