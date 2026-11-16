import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateSchoolRegistrationTotal } from '@/lib/school-registration'

test('school-admin student registration checkout totals include the processing fee per student', () => {
  assert.equal(calculateSchoolRegistrationTotal(1), 2_161.25)
  assert.equal(calculateSchoolRegistrationTotal(3), 6_483.75)
  assert.equal(calculateSchoolRegistrationTotal(100), 216_125)
})

test('school-admin registration totals reject invalid batch sizes', () => {
  assert.throws(() => calculateSchoolRegistrationTotal(0), /between 1 and 100/)
  assert.throws(() => calculateSchoolRegistrationTotal(1.5), /between 1 and 100/)
  assert.throws(() => calculateSchoolRegistrationTotal(101), /between 1 and 100/)
})
