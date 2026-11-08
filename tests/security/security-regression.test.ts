import test from 'node:test'
import assert from 'node:assert/strict'
import { checkQuota, DEFAULT_RESOURCE_LIMITS } from '../../lib/limits'
import { verifyDocumentAccessAuthorization } from '../../lib/storage-media'
import { rateLimit } from '../../lib/rate-limit'
import { getRedirectUrlForIdentity } from '../../lib/auth/redirectMap'
import { canSchoolAdminAccess } from '../../lib/auth/school-admin-permissions'

test('Multi-tenant storage document access prevents cross-school leaking', () => {
  // A teacher from school A requesting a document owned by school B must be denied
  const crossTenantAllowed = verifyDocumentAccessAuthorization({
    documentSchoolId: 'school-b',
    userSchoolId: 'school-a',
    userRole: 'TEACHER',
  })
  assert.equal(crossTenantAllowed, false)

  // Within the same school, teacher is allowed
  const sameSchoolAllowed = verifyDocumentAccessAuthorization({
    documentSchoolId: 'school-a',
    userSchoolId: 'school-a',
    userRole: 'TEACHER',
  })
  assert.equal(sameSchoolAllowed, true)

  // SUPER_ADMIN can access documents across schools
  const superAdminAllowed = verifyDocumentAccessAuthorization({
    documentSchoolId: 'school-b',
    userSchoolId: null,
    userRole: 'SUPER_ADMIN',
  })
  assert.equal(superAdminAllowed, true)
})

test('Rate limiting enforces abuse protection on sensitive endpoints', () => {
  const ip = '198.51.100.42'
  const prefix = `test-otp-${Date.now()}`
  const maxAttempts = 3
  const windowSeconds = 60

  // 3 attempts are allowed
  const res1 = rateLimit(`${prefix}:${ip}`, maxAttempts, windowSeconds)
  assert.equal(res1.allowed, true)

  const res2 = rateLimit(`${prefix}:${ip}`, maxAttempts, windowSeconds)
  assert.equal(res2.allowed, true)

  const res3 = rateLimit(`${prefix}:${ip}`, maxAttempts, windowSeconds)
  assert.equal(res3.allowed, true)

  // 4th attempt is rate-limited
  const res4 = rateLimit(`${prefix}:${ip}`, maxAttempts, windowSeconds)
  assert.equal(res4.allowed, false)
})

test('Tenant resource quotas prevent runaway student and export allocations', async () => {
  // Quota validation with default limits
  const quotaCheck = await checkQuota(undefined, 'maxStudents', 2000, 1)
  assert.equal(quotaCheck.allowed, false)
  assert.equal(quotaCheck.limit, DEFAULT_RESOURCE_LIMITS.maxStudents)

  const underQuota = await checkQuota(undefined, 'maxStudents', 500, 1)
  assert.equal(underQuota.allowed, true)
  assert.equal(underQuota.remaining, 1500)
})

test('Role-based navigation redirect prevents unauthorized dashboard routing', () => {
  assert.equal(getRedirectUrlForIdentity({ role: 'SUPER_ADMIN' }), '/dashboard/super-admin/overview')
  assert.equal(getRedirectUrlForIdentity({ role: 'SCHOOL_ADMIN' }), '/dashboard/admin')
  assert.equal(getRedirectUrlForIdentity({ role: 'TEACHER' }), '/dashboard/teacher')
  assert.equal(getRedirectUrlForIdentity({ role: 'PARENT' }), '/dashboard/parent')
  assert.equal(getRedirectUrlForIdentity({ role: 'STUDENT' }), '/dashboard/student')
})

test('School admin levels isolate financial and promotion permissions', () => {
  assert.equal(canSchoolAdminAccess('PRIMARY_ADMIN', 'read', 'payment'), true)
  assert.equal(canSchoolAdminAccess('VICE_PRINCIPAL_ACADEMICS', 'read', 'payment'), false)
  assert.equal(canSchoolAdminAccess('VICE_PRINCIPAL_ADMIN', 'read', 'transaction'), false)
  assert.equal(canSchoolAdminAccess('HOD_SCIENCE', 'read', 'teacher'), true)
  assert.equal(canSchoolAdminAccess('HOD_SCIENCE', 'publish', 'student'), false)
  assert.equal(canSchoolAdminAccess('HOD_SCIENCE', 'update', 'student', 'expulsion'), false)
  assert.equal(canSchoolAdminAccess('HOD_SCIENCE', 'update', 'teacher', 'teacher promotion'), false)
  assert.equal(canSchoolAdminAccess('HOD_SCIENCE', 'create', 'payment'), false)
})
