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
    password: '',
    registeredClasses: ['Primary 3'],
    allowParents: true,
  })

  assert.equal(result.success, false)
  assert.equal(result.error, 'School name, location, contact email, and applicant name are required.')
})

test('getSchoolByCodeAction - handles invalid or empty school codes gracefully', async () => {
  const res = await getSchoolByCodeAction('NON_EXISTENT_CODE_12345')
  assert.equal(res.success, false)
  assert.ok(typeof res.error === 'string' && res.error.length > 0)
})
