## 2026-03-31 — Consolidated Drizzle Schema Table Exports & Typecheck Script Procedure
**Context:** Debugging build errors caused by duplicate `schoolRegistrationApplication` declarations in `lib/db/schema.ts` and mismatched server action exports.
**Learning:** `package.json` lacks a `typecheck` script; running `pnpm exec tsc --noEmit` directly provides accurate full-project type checking without relying on `npx tsc`. Duplicate Drizzle ORM table exports in `lib/db/schema.ts` break ORM type inference and cause cascade errors across server actions and payment services.
**Action:** Use `pnpm exec tsc --noEmit` for type checking, and ensure all Drizzle table definitions are declared exactly once per table name with consolidated column definitions.

## 2026-03-31 — CSV Formula Sanitization vs Numeric Values & Node.js Native Test Extension
**Context:** Fixing CSV formula injection sanitization converting valid negative numbers into strings and adding unit tests with Node native test runner.
**Learning:** Prepending single quote `'` for CSV formula injection must exclude valid negative/positive numbers (`/^[-+]?\d+(\.\d+)?$/`) to prevent string conversion of negative grades/scores/balances. In Node.js native test runner (`node --test`), relative imports in TS test files require standard module resolution without `.ts` extension when compiled/typechecked via `tsc --noEmit`.
**Action:** Use `/^[-+]?\d+(\.\d+)?$/` check in `sanitizeCSVFormula` to preserve numeric values, and import TS files without `.ts` extension in test suites.

## 2026-03-31 — Korapay Webhook Signature Case Normalization & Constant-Time Comparison
**Context:** Hardening Korapay payment webhook verification against header variations and whitespace formatting issues.
**Learning:** Korapay HMAC SHA256 signatures generated via Node `crypto` produce lowercase hex strings. Webhook headers passed through reverse proxies or CDNs may introduce trailing whitespace or uppercase characters. Normalizing signature strings with `.trim().toLowerCase()` before converting to `Buffer` and comparing via `crypto.timingSafeEqual` prevents spurious verification failures without compromising side-channel protection.
**Action:** Always normalize incoming hex signatures with `.trim().toLowerCase()` before `crypto.timingSafeEqual` buffer comparisons.

## 2026-03-31 — Multi-Tenant Deletion Scoping & Exporting Pure Validation Helpers
**Context:** Hardening timetable server actions and writing unit tests against authorization bypasses and multi-tenant data leaks.
**Learning:** Deleting multi-tenant DB records matching a non-unique attribute (e.g. `className`) without requiring an explicit `schoolId` causes catastrophic cross-tenant data deletion when invoked by users lacking a session `schoolId` (e.g. `SUPER_ADMIN`). Furthermore, unit test suites must import pure exported helper/validator functions from server action modules rather than re-implementing mock logic internally.
**Action:** Require explicit `schoolId` in multi-tenant table mutation actions and export validation helper functions to share across server actions and unit test suites.
