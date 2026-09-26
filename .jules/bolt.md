## 2026-03-31 — Consolidated Drizzle Schema Table Exports & Typecheck Script Procedure
**Context:** Debugging build errors caused by duplicate `schoolRegistrationApplication` declarations in `lib/db/schema.ts` and mismatched server action exports.
**Learning:** `package.json` lacks a `typecheck` script; running `pnpm exec tsc --noEmit` directly provides accurate full-project type checking without relying on `npx tsc`. Duplicate Drizzle ORM table exports in `lib/db/schema.ts` break ORM type inference and cause cascade errors across server actions and payment services.
**Action:** Use `pnpm exec tsc --noEmit` for type checking, and ensure all Drizzle table definitions are declared exactly once per table name with consolidated column definitions.

## 2026-03-31 — CSV Formula Sanitization vs Numeric Values & Node.js Native Test Extension
**Context:** Fixing CSV formula injection sanitization converting valid negative numbers into strings and adding unit tests with Node native test runner.
**Learning:** Prepending single quote `'` for CSV formula injection must exclude valid negative/positive numbers (`/^[-+]?\d+(\.\d+)?$/`) to prevent string conversion of negative grades/scores/balances. In Node.js native test runner (`node --test`), relative imports in TS test files require standard module resolution without `.ts` extension when compiled/typechecked via `tsc --noEmit`.
**Action:** Use `/^[-+]?\d+(\.\d+)?$/` check in `sanitizeCSVFormula` to preserve numeric values, and import TS files without `.ts` extension in test suites.

## 2026-03-31 — Multi-Tenant Fail-Closed Scoping & Insecure String Matching
**Context:** Fixing authorization bypass and cross-tenant report card data exposure across Server Actions in `app/actions/report-cards.ts`.
**Learning:** Falling back to unrestricted record selection when school or identity context is missing (`schoolId == null`) creates a severe fail-open vulnerability that exposes all tenant data across schools. Furthermore, authorizing records using mutable or non-unique string attributes (such as `studentName`) introduces IDOR risks. Database queries must filter at the SQL layer using `inArray` or explicit `where` clauses on immutable IDs (`studentId`, `schoolId`, `parentId`) and fail closed when tenant context cannot be resolved.
**Action:** Always enforce fail-closed checks (`return []`) when session or tenant context is missing, filter records in database SQL queries rather than fetching full tables into memory, and authorize strictly using immutable IDs.
