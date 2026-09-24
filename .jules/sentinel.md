## 2026-03-31 — Unauthenticated Admin Attendance Export Endpoint
**Vulnerability:** Missing authentication, role authorization, and tenant isolation on `/api/admin/attendance/export`.
**Context:** Found in `app/api/admin/attendance/export/route.ts` where GET requests directly queried DB using search parameters without `auth.getSession()` or role/school ID authorization checks.
**Learning:** Data export API endpoints under `/api/admin/*` might be inadvertently created without `auth.getSession()` checks or school tenant scoping.
**Prevention:** All admin API endpoints in `/api/admin/*` must explicitly invoke `auth.getSession()`, verify admin roles (`['PRIMARY_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN']`), enforce `session.user.schoolId` tenant isolation for non-SUPER_ADMIN users, and sanitize errors via `sanitizeServerError`.

## 2026-03-31 — Cross-Tenant IDOR in Quiz CSV Import Route
**Vulnerability:** Missing school tenant scoping when adding questions to an assessment via `/api/upload-csv`.
**Context:** Found in `app/api/upload-csv/route.ts` where `type === 'quiz'` requests accepted `targetId` and inserted questions into `assessmentQuestion` without verifying `existingAssessment.schoolId` matched the uploading user's `schoolId`.
**Learning:** File upload endpoints handling CSV or bulk data for resource IDs (`targetId`) can be vectors for cross-tenant IDOR if they check target existence without validating resource ownership / school tenant matching.
**Prevention:** Always verify that target resources specified in POST requests (such as `targetId` or `assessmentId`) belong to the authenticated user's `schoolId` before modifying records, unless the user holds the global `SUPER_ADMIN` role.
