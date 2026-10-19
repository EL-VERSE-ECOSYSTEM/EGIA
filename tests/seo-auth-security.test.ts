import test from 'node:test'
import assert from 'node:assert/strict'
import { isPublicRoute } from '../lib/public-routes.ts'

test('SEO & User Protection Security Suite', async (t) => {
  await t.test('Password strength validation rules', () => {
    const validatePassword = (pass: string) => {
      if (!pass || pass.length < 8) return false
      return true
    }

    assert.equal(validatePassword('short'), false)
    assert.equal(validatePassword('1234567'), false)
    assert.equal(validatePassword('12345678'), true)
    assert.equal(validatePassword('SuperSecurePassword2026!'), true)
  })

  await t.test('Identifier & email input sanitization', () => {
    const sanitizeEmail = (input: string) => input.trim().toLowerCase()
    const sanitizeName = (input: string) => input.trim()

    assert.equal(sanitizeEmail('  John.Doe@Example.COM '), 'john.doe@example.com')
    assert.equal(sanitizeName('   Chidi   '), 'Chidi')
  })

  await t.test('Public SEO route configuration verification', () => {
    assert.equal(isPublicRoute('/'), true)
    assert.equal(isPublicRoute('/llms.txt'), true)
    assert.equal(isPublicRoute('/llms-full.txt'), true)
    assert.equal(isPublicRoute('/og'), true)
    assert.equal(isPublicRoute('/sitemap.xml'), true)
    assert.equal(isPublicRoute('/robots.txt'), true)
    assert.equal(isPublicRoute('/school-registration/step-2'), true)
    assert.equal(isPublicRoute('/privacy-impersonation'), false)
    assert.equal(isPublicRoute('/auth/signin-extra'), false)
  })

  await t.test('Role-based Super Admin privilege check', () => {
    const isSuperAdminRole = (role: string) => role.trim().toUpperCase() === 'SUPER_ADMIN'

    assert.equal(isSuperAdminRole('SUPER_ADMIN'), true)
    assert.equal(isSuperAdminRole(' super_admin '), true)
    assert.equal(isSuperAdminRole('TEACHER'), false)
    assert.equal(isSuperAdminRole('STUDENT'), false)
  })
})
