import test from 'node:test'
import assert from 'node:assert/strict'
import { registerSchoolAction, getSchoolByCodeAction } from '../app/actions/school'

test('School Registration - validates required input fields', async () => {
  const result = await registerSchoolAction({
    name: '',
    location: '',
    adminName: '',
    adminPhone: '',
    adminEmail: '',
    registeredClasses: ['Primary 3'],
    allowParents: true,
  })

  assert.equal(result.success, false)
  assert.equal(result.error, 'School name, location, contact email, and applicant name are required.')
})

test('School Registration - enforces minimum password length of 8 characters', async () => {
  const result = await registerSchoolAction({
    name: 'Test Academy',
    location: 'Lagos',
    adminName: 'Admin Person',
    adminPhone: '08012345678',
    adminEmail: 'admin@testacademy.com',
    password: 'short',
    confirmPassword: 'short',
    registeredClasses: ['Primary 3'],
    allowParents: true,
  })

  assert.equal(result.success, false)
  assert.equal(result.error, 'Password must be at least 8 characters long.')
})

test('School Registration - rejects mismatched passwords', async () => {
  const result = await registerSchoolAction({
    name: 'Test Academy',
    location: 'Lagos',
    adminName: 'Admin Person',
    adminPhone: '08012345678',
    adminEmail: 'admin@testacademy.com',
    password: 'Password123!',
    confirmPassword: 'Password456!',
    registeredClasses: ['Primary 3'],
    allowParents: true,
  })

  assert.equal(result.success, false)
  assert.equal(result.error, 'Passwords do not match.')
})

test('getSchoolByCodeAction - handles invalid or empty school codes gracefully', async () => {
  const res = await getSchoolByCodeAction('NON_EXISTENT_CODE_12345')
  assert.equal(res.success, false)
  assert.ok(typeof res.error === 'string' && res.error.length > 0)
})
