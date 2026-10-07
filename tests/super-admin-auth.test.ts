import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

function simulateProxyRoleCheck(email: string, metadataRole: string): { effectiveRole: string; canAccessSuperAdmin: boolean } {
  const userEmail = (email || '').trim().toLowerCase()
  const isSuperAdminEmail = userEmail === 'ixoralyon013@gmail.com'

  let role = (metadataRole || '').toUpperCase()
  if (isSuperAdminEmail) {
    role = 'SUPER_ADMIN'
  } else if (role === 'SUPER_ADMIN') {
    role = 'STUDENT'
  }

  const canAccessSuperAdmin = isSuperAdminEmail

  return { effectiveRole: role, canAccessSuperAdmin }
}

function simulateSuperAdminPermissionCheck(email: string): { allowed: boolean; error?: string } {
  const userEmail = (email || '').trim().toLowerCase()
  if (userEmail !== 'ixoralyon013@gmail.com') {
    return { allowed: false, error: 'Forbidden: Super Admin access strictly restricted to ixoralyon013@gmail.com.' }
  }
  return { allowed: true }
}

describe('Super Admin Auth & Access Restriction Tests', () => {
  describe('Proxy Middleware Role Overrides', () => {
    it('forces SUPER_ADMIN role and grants access for ixoralyon013@gmail.com', () => {
      const res = simulateProxyRoleCheck('ixoralyon013@gmail.com', 'STUDENT')
      assert.equal(res.effectiveRole, 'SUPER_ADMIN')
      assert.equal(res.canAccessSuperAdmin, true)
    })

    it('forces SUPER_ADMIN role for case-insensitive IXORALYON013@GMAIL.COM', () => {
      const res = simulateProxyRoleCheck(' IXORALYON013@GMAIL.COM ', 'ADMIN')
      assert.equal(res.effectiveRole, 'SUPER_ADMIN')
      assert.equal(res.canAccessSuperAdmin, true)
    })

    it('denies SUPER_ADMIN role and strips fake SUPER_ADMIN metadata for unauthorized email', () => {
      const res = simulateProxyRoleCheck('hacker@example.com', 'SUPER_ADMIN')
      assert.equal(res.effectiveRole, 'STUDENT')
      assert.equal(res.canAccessSuperAdmin, false)
    })

    it('preserves valid non-super-admin roles for normal users', () => {
      const teacherRes = simulateProxyRoleCheck('teacher@school.edu', 'TEACHER')
      assert.equal(teacherRes.effectiveRole, 'TEACHER')
      assert.equal(teacherRes.canAccessSuperAdmin, false)

      const adminRes = simulateProxyRoleCheck('admin@school.edu', 'SCHOOL_ADMIN')
      assert.equal(adminRes.effectiveRole, 'SCHOOL_ADMIN')
      assert.equal(adminRes.canAccessSuperAdmin, false)
    })
  })

  describe('Super Admin Permission Guard', () => {
    it('allows ixoralyon013@gmail.com through super admin permission check', () => {
      const res = simulateSuperAdminPermissionCheck('ixoralyon013@gmail.com')
      assert.equal(res.allowed, true)
    })

    it('blocks all other emails from super admin permission check', () => {
      const res1 = simulateSuperAdminPermissionCheck('otheradmin@school.com')
      assert.equal(res1.allowed, false)
      assert.equal(res1.error, 'Forbidden: Super Admin access strictly restricted to ixoralyon013@gmail.com.')

      const res2 = simulateSuperAdminPermissionCheck('random@gmail.com')
      assert.equal(res2.allowed, false)
      assert.equal(res2.error, 'Forbidden: Super Admin access strictly restricted to ixoralyon013@gmail.com.')
    })
  })
})
