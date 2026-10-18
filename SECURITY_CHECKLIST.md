# Security Checklist

- [x] **Environment Variables & Secrets:** `.env` untracked in Git; secrets stored securely.
- [x] **Multi-Tenant Isolation:** Database queries and server actions filter closed by `schoolId`.
- [x] **Timing-Safe Token Verification:** `crypto.timingSafeEqual` used for secret comparisons.
- [x] **Korapay Signature Verification:** HMAC SHA256 validation on `/api/webhooks/korapay`.
- [x] **Payment Idempotency:** Duplicate payment verifications do not extend validity deadlines.
- [x] **Password Validation:** Server-side minimum length enforcement (8+ chars) with strength meter.
- [x] **Password Update Interval:** Minimum 3-day wait interval enforced between user password changes.
- [x] **FCM Device Token Cleanup:** Automatic deactivation of invalid/unregistered FCM push tokens.
- [x] **Supabase Realtime Security:** Publications scoped to valid tables and protected by RLS.
- [x] **File Storage Authorization:** Signed URLs used for sensitive institutional receipts and proof-of-address documents.
