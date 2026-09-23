## 2026-03-31 — Unauthenticated Admin Attendance Export Endpoint
**Vulnerability:** Missing authentication, role authorization, and tenant isolation on `/api/admin/attendance/export`.
**Context:** Found in `app/api/admin/attendance/export/route.ts` where GET requests directly queried DB using search parameters without `auth.getSession()` or role/school ID authorization checks.
**Learning:** Data export API endpoints under `/api/admin/*` might be inadvertently created without `auth.getSession()` checks or school tenant scoping.
**Prevention:** All admin API endpoints in `/api/admin/*` must explicitly invoke `auth.getSession()`, verify admin roles (`['PRIMARY_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN']`), enforce `session.user.schoolId` tenant isolation for non-SUPER_ADMIN users, and sanitize errors via `sanitizeServerError`.
