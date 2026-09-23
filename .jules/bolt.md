## 2026-03-31 — Consolidated Drizzle Schema Table Exports & Typecheck Script Procedure
**Context:** Debugging build errors caused by duplicate `schoolRegistrationApplication` declarations in `lib/db/schema.ts` and mismatched server action exports.
**Learning:** `package.json` lacks a `typecheck` script; running `pnpm exec tsc --noEmit` directly provides accurate full-project type checking without relying on `npx tsc`. Duplicate Drizzle ORM table exports in `lib/db/schema.ts` break ORM type inference and cause cascade errors across server actions and payment services.
**Action:** Use `pnpm exec tsc --noEmit` for type checking, and ensure all Drizzle table definitions are declared exactly once per table name with consolidated column definitions.

## 2026-03-31 — CSV Formula Sanitization vs Numeric Values & Node.js Native Test Extension
**Context:** Fixing CSV formula injection sanitization converting valid negative numbers into strings and adding unit tests with Node native test runner.
**Learning:** Prepending single quote `'` for CSV formula injection must exclude valid negative/positive numbers (`/^[-+]?\d+(\.\d+)?$/`) to prevent string conversion of negative grades/scores/balances. In Node.js native test runner (`node --test`), relative imports in TS test files require standard module resolution without `.ts` extension when compiled/typechecked via `tsc --noEmit`.
**Action:** Use `/^[-+]?\d+(\.\d+)?$/` check in `sanitizeCSVFormula` to preserve numeric values, and import TS files without `.ts` extension in test suites.
