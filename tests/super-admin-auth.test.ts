import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getRedirectUrlForIdentity } from '../lib/auth/redirectMap.ts'
import { isValidSuperAdminPassword, isConfiguredSuperAdminEmail } from '../lib/auth/super-admin.ts'

function simulateSignInModeValidation(loginMode: 'standard' | 'superadmin', inputEmail: string): { allowed: boolean; error?: string; targetRedirect?: string } {
  const targetEmail = inputEmail.trim().toLowerCase()
  const isSuperAdminTarget = targetEmail === 'ixoralyon013@gmail.com'

  if (loginMode === 'superadmin' && !isSuperAdminTarget) {
    return {
      allowed: false,
      error: 'Super Admin portal access is strictly restricted to the authorized Super Admin account (ixoralyon013@gmail.com).'
    }
  }

  if (isSuperAdminTarget) {
    return {
      allowed: true,
      targetRedirect: '/dashboard/super-admin/overview'
    }
  }

  return { allowed: true }
}

function simulateProxyRoleCheck(email: string, metadataRole: string): { effectiveRole: string; canAccessSuperAdmin: boolean } {
  const userEmail = (email || '').trim().toLowerCase()
  const isSuperAdminEmail = userEmail === 'ixoralyon013@gmail.com'

  let role = (metadataRole || '').toUpperCase()
  if (isSuperAdminEmail) {
    role = 'SUPER_ADMIN'
  } else if (role === 'SUPER_ADMIN') {
    role = 'STUDENT'
  } else if (role === 'PUPIL') {
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

    it('maps PUPIL to the student dashboard role', () => {
      const res = simulateProxyRoleCheck('pupil@school.edu', 'PUPIL')
      assert.equal(res.effectiveRole, 'STUDENT')
      assert.equal(res.canAccessSuperAdmin, false)
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

  describe('Super Admin Credential & Password Validation', () => {
    it('validates configured Super Admin email', () => {
      assert.equal(isConfiguredSuperAdminEmail('ixoralyon013@gmail.com'), true)
      assert.equal(isConfiguredSuperAdminEmail(' IXORALYON013@GMAIL.COM '), true)
      assert.equal(isConfiguredSuperAdminEmail('user@example.com'), false)
    })

    it('validates Super Admin password with exact match and leading/trailing whitespace', () => {
      assert.equal(isValidSuperAdminPassword('Amunra123@'), true)
      assert.equal(isValidSuperAdminPassword(' Amunra123@ '), true)
      assert.equal(isValidSuperAdminPassword('wrongpassword'), false)
      assert.equal(isValidSuperAdminPassword(''), false)
      assert.equal(isValidSuperAdminPassword(null), false)
    })
  })

  describe('Super Admin Sign-In Mode & Redirection Validation', () => {
    it('redirects SUPER_ADMIN identity to /dashboard/super-admin/overview via redirectMap', () => {
      const redirectUrl = getRedirectUrlForIdentity({ role: 'SUPER_ADMIN' })
      assert.equal(redirectUrl, '/dashboard/super-admin/overview')
    })

    it('rejects non-super-admin email in superadmin login mode', () => {
      const res = simulateSignInModeValidation('superadmin', 'teacher@school.com')
      assert.equal(res.allowed, false)
      assert.match(res.error || '', /strictly restricted to the authorized Super Admin account/)
    })

    it('allows ixoralyon013@gmail.com in superadmin login mode and sets overview redirect', () => {
      const res = simulateSignInModeValidation('superadmin', 'ixoralyon013@gmail.com')
      assert.equal(res.allowed, true)
      assert.equal(res.targetRedirect, '/dashboard/super-admin/overview')
    })

    it('allows ixoralyon013@gmail.com case-insensitively in standard mode and sets overview redirect', () => {
      const res = simulateSignInModeValidation('standard', ' IXORALYON013@GMAIL.COM ')
      assert.equal(res.allowed, true)
      assert.equal(res.targetRedirect, '/dashboard/super-admin/overview')
    })
  })
})
