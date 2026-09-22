## 2026-03-31 — Consolidated Drizzle Schema Table Exports & Typecheck Script Procedure
**Context:** Debugging build errors caused by duplicate `schoolRegistrationApplication` declarations in `lib/db/schema.ts` and mismatched server action exports.
**Learning:** `package.json` lacks a `typecheck` script; running `pnpm exec tsc --noEmit` directly provides accurate full-project type checking without relying on `npx tsc`. Duplicate Drizzle ORM table exports in `lib/db/schema.ts` break ORM type inference and cause cascade errors across server actions and payment services.
**Action:** Use `pnpm exec tsc --noEmit` for type checking, and ensure all Drizzle table definitions are declared exactly once per table name with consolidated column definitions.
