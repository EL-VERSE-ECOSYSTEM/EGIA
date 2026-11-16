import assert from 'node:assert/strict'
import test from 'node:test'
import { generateAdmissionNumber, generateStaffId, isValidAdmissionNumber, isValidStaffId } from '@/lib/id'

test('school learner numbers use school prefix, level tag, and six digits', () => {
  const pupilNumber = generateAdmissionNumber('Basic 5', 'Example Academy')
  const studentNumber = generateAdmissionNumber('JSS1', 'Example Academy')

  assert.match(pupilNumber, /^EXAM-P-\d{6}$/)
  assert.match(studentNumber, /^EXAM-S-\d{6}$/)
  assert.equal(isValidAdmissionNumber(pupilNumber, 'Basic 5', 'EXAM-123456'), true)
  assert.equal(isValidAdmissionNumber(studentNumber, 'JSS1', 'EXAM-123456'), true)
  assert.equal(isValidAdmissionNumber(pupilNumber, 'JSS1', 'EXAM-123456'), false)
})

test('school staff IDs use the school prefix and six-digit staff sequence format', () => {
  const staffId = generateStaffId('EXAM-123456')

  assert.match(staffId, /^EXAM-ST-\d{6}$/)
  assert.equal(isValidStaffId(staffId, 'EXAM-123456'), true)
  assert.equal(isValidStaffId(staffId, 'OTHR-123456'), false)
})
