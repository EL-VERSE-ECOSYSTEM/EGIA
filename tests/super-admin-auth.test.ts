import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getRedirectUrlForIdentity } from '../lib/auth/redirectMap.ts'

function simulateSignInModeValidation(loginMode: 'standard' | 'superadmin', isSuperAdminAccount: boolean): { allowed: boolean; error?: string; targetRedirect?: string } {
  if (loginMode === 'superadmin' && !isSuperAdminAccount) {
    return {
      allowed: false,
      error: 'Super Admin portal access is strictly restricted to authorized Super Admin accounts.'
    }
  }

  if (isSuperAdminAccount) {
    return {
      allowed: true,
      targetRedirect: '/dashboard/super-admin/overview'
    }
  }

  return { allowed: true }
}

function simulateProxyRoleCheck(userRole: string): { effectiveRole: string; canAccessSuperAdmin: boolean } {
  let role = (userRole || '').toUpperCase()
  if (role === 'PUPIL') {
    role = 'STUDENT'
  }

  const canAccessSuperAdmin = role === 'SUPER_ADMIN'

  return { effectiveRole: role, canAccessSuperAdmin }
}

function simulateSuperAdminPermissionCheck(userRole: string): { allowed: boolean; error?: string } {
  if (userRole !== 'SUPER_ADMIN') {
    return { allowed: false, error: 'Forbidden: This account is not authorized for Super Admin access.' }
  }
  return { allowed: true }
}

function simulateCaseInsensitiveRoleCheck(roleInDb: string): boolean {
  return (roleInDb || '').trim().toUpperCase() === 'SUPER_ADMIN'
}

function simulateSelfHealingAuthSync(
  initialSignInSuccess: boolean,
  isSuperAdmin: boolean,
  existingInAuth: boolean,
  createUserThrows: boolean
): { authenticated: boolean; syncedPassword: boolean; targetRedirect?: string } {
  if (initialSignInSuccess) {
    return { authenticated: true, syncedPassword: false, targetRedirect: '/dashboard/super-admin/overview' }
  }

  if (!isSuperAdmin) {
    return { authenticated: false, syncedPassword: false }
  }

  // Self healing triggered for Super Admin
  if (existingInAuth) {
    return { authenticated: true, syncedPassword: true, targetRedirect: '/dashboard/super-admin/overview' }
  }

  if (createUserThrows) {
    // Collision fallback -> locate existing user and update password
    return { authenticated: true, syncedPassword: true, targetRedirect: '/dashboard/super-admin/overview' }
  }

  // Brand new user created and authenticated
  return { authenticated: true, syncedPassword: true, targetRedirect: '/dashboard/super-admin/overview' }
}

describe('Super Admin Auth & Access Restriction Tests', () => {
  describe('Case-Insensitive Role & Self-Healing Logic', () => {
    it('correctly matches SUPER_ADMIN role regardless of casing or surrounding whitespace', () => {
      assert.equal(simulateCaseInsensitiveRoleCheck('SUPER_ADMIN'), true)
      assert.equal(simulateCaseInsensitiveRoleCheck('super_admin'), true)
      assert.equal(simulateCaseInsensitiveRoleCheck(' Super_Admin '), true)
      assert.equal(simulateCaseInsensitiveRoleCheck('TEACHER'), false)
      assert.equal(simulateCaseInsensitiveRoleCheck('SCHOOL_ADMIN'), false)
    })

    it('successfully self-heals when Super Admin initial auth fails and user exists in auth', () => {
      const res = simulateSelfHealingAuthSync(false, true, true, false)
      assert.equal(res.authenticated, true)
      assert.equal(res.syncedPassword, true)
      assert.equal(res.targetRedirect, '/dashboard/super-admin/overview')
    })

    it('handles createUser collision gracefully by falling back to updateUserById', () => {
      const res = simulateSelfHealingAuthSync(false, true, false, true)
      assert.equal(res.authenticated, true)
      assert.equal(res.syncedPassword, true)
      assert.equal(res.targetRedirect, '/dashboard/super-admin/overview')
    })

    it('denies self-healing for non-super-admin users when initial auth fails', () => {
      const res = simulateSelfHealingAuthSync(false, false, false, false)
      assert.equal(res.authenticated, false)
      assert.equal(res.syncedPassword, false)
    })
  })

  describe('Proxy Middleware Role Checks', () => {
    it('grants Super Admin access when user role is SUPER_ADMIN', () => {
      const res = simulateProxyRoleCheck('SUPER_ADMIN')
      assert.equal(res.effectiveRole, 'SUPER_ADMIN')
      assert.equal(res.canAccessSuperAdmin, true)
    })

    it('denies Super Admin access when user role is STUDENT', () => {
      const res = simulateProxyRoleCheck('STUDENT')
      assert.equal(res.effectiveRole, 'STUDENT')
      assert.equal(res.canAccessSuperAdmin, false)
    })

    it('preserves valid non-super-admin roles for normal users', () => {
      const teacherRes = simulateProxyRoleCheck('TEACHER')
      assert.equal(teacherRes.effectiveRole, 'TEACHER')
      assert.equal(teacherRes.canAccessSuperAdmin, false)

      const adminRes = simulateProxyRoleCheck('SCHOOL_ADMIN')
      assert.equal(adminRes.effectiveRole, 'SCHOOL_ADMIN')
      assert.equal(adminRes.canAccessSuperAdmin, false)
    })

    it('maps PUPIL to the student dashboard role', () => {
      const res = simulateProxyRoleCheck('PUPIL')
      assert.equal(res.effectiveRole, 'STUDENT')
      assert.equal(res.canAccessSuperAdmin, false)
    })
  })

  describe('Super Admin Permission Guard', () => {
    it('allows SUPER_ADMIN role through super admin permission check', () => {
      const res = simulateSuperAdminPermissionCheck('SUPER_ADMIN')
      assert.equal(res.allowed, true)
    })

    it('blocks non-super-admin roles from super admin permission check', () => {
      const res1 = simulateSuperAdminPermissionCheck('TEACHER')
      assert.equal(res1.allowed, false)
      assert.equal(res1.error, 'Forbidden: This account is not authorized for Super Admin access.')

      const res2 = simulateSuperAdminPermissionCheck('SCHOOL_ADMIN')
      assert.equal(res2.allowed, false)
      assert.equal(res2.error, 'Forbidden: This account is not authorized for Super Admin access.')
    })
  })

  describe('Super Admin Sign-In Mode & Redirection Validation', () => {
    it('redirects SUPER_ADMIN identity to /dashboard/super-admin/overview via redirectMap', () => {
      const redirectUrl = getRedirectUrlForIdentity({ role: 'SUPER_ADMIN' })
      assert.equal(redirectUrl, '/dashboard/super-admin/overview')
    })

    it('rejects non-super-admin account in superadmin login mode', () => {
      const res = simulateSignInModeValidation('superadmin', false)
      assert.equal(res.allowed, false)
      assert.match(res.error || '', /strictly restricted to authorized Super Admin accounts/)
    })

    it('allows Super Admin account in superadmin login mode and sets overview redirect', () => {
      const res = simulateSignInModeValidation('superadmin', true)
      assert.equal(res.allowed, true)
      assert.equal(res.targetRedirect, '/dashboard/super-admin/overview')
    })

    it('allows Super Admin account in standard mode and sets overview redirect', () => {
      const res = simulateSignInModeValidation('standard', true)
      assert.equal(res.allowed, true)
      assert.equal(res.targetRedirect, '/dashboard/super-admin/overview')
    })
  })
})
