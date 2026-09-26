## 2026-03-31 — Unauthenticated Admin Attendance Export Endpoint
**Vulnerability:** Missing authentication, role authorization, and tenant isolation on `/api/admin/attendance/export`.
**Context:** Found in `app/api/admin/attendance/export/route.ts` where GET requests directly queried DB using search parameters without `auth.getSession()` or role/school ID authorization checks.
**Learning:** Data export API endpoints under `/api/admin/*` might be inadvertently created without `auth.getSession()` checks or school tenant scoping.
**Prevention:** All admin API endpoints in `/api/admin/*` must explicitly invoke `auth.getSession()`, verify admin roles (`['PRIMARY_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN']`), enforce `session.user.schoolId` tenant isolation for non-SUPER_ADMIN users, and sanitize errors via `sanitizeServerError`.

## 2026-04-01 — Unparameterized Raw SQL Construction in Library Search API
**Vulnerability:** Parameter placeholders `$1`, `$2` created as string literals inside `sql.raw()` without parameter binding in `app/api/library/books/search/route.ts`.
**Context:** Searching library books with filter parameters caused query execution failures due to missing positional parameters, risking SQL injection or raw string interpolation fixes.
**Learning:** `sql.raw()` in Drizzle bypasses parameter binding. Constructing positional `$1` parameter markers manually and passing raw SQL strings without bound parameter arrays breaks Postgres execution and invites unsafe string interpolation.
**Prevention:** Always construct dynamic SQL conditions as Drizzle `sql` template fragments and combine them using `sql.join(conditions, sql\` AND \`)`. This guarantees proper parameter binding for every user input and prevents SQL injection.
## 2026-03-31 — Assessment Schedule Cross-Tenant IDOR and Data Leakage
**Vulnerability:** Unrestricted GET and cross-tenant POST operations on `/api/teacher/assessments/schedule`.
**Context:** Route handler permitted POST requests from any teacher or admin to schedule assessments belonging to other schools without tenant or creator authorization checks. GET handler returned all assessment schedules across all schools without authentication or school scoping, and catch blocks exposed raw database error messages (`error.message`).
**Learning:** API routes performing read or write operations on assessment sub-resources (such as schedules or questions) must check session authentication, verify role permissions, enforce `schoolId` tenant scoping via assessment lookups, and sanitize server errors using `sanitizeServerError`.
**Prevention:** Always authenticate requests via `auth.getSession()`, verify resource ownership/school tenant isolation before mutation, filter GET list queries by `assessment.schoolId = session.user.schoolId`, and sanitize catch-block error responses.
