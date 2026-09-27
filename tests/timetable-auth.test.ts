import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  canModifyTimetableRole,
  validateAndSanitizeTimetableEntry,
  ALLOWED_TIMETABLE_ROLES
} from '../lib/timetable'

interface MockUser {
  id: string
  role: string
  schoolId: string | null
}

interface MockSession {
  user: MockUser
}

function simulateSaveTimetableAccessCheck(
  session: MockSession | null,
  targetSchoolIdInput?: string
): { allowed: boolean; error?: string } {
  if (!session?.user) {
    return { allowed: false, error: 'Unauthorized session.' }
  }
  const role = session.user.role || ''
  if (!canModifyTimetableRole(role)) {
    return { allowed: false, error: 'Forbidden: Insufficient permissions to modify timetable.' }
  }
  const effectiveSchoolId = session.user.schoolId || targetSchoolIdInput || null
  if (!effectiveSchoolId) {
    return { allowed: false, error: 'School context (schoolId) is required to save timetable.' }
  }
  return { allowed: true }
}

describe('Timetable Action Auth & Input Validation', () => {
  describe('saveTimetableAction Role Authorization & Multi-Tenant Scoping', () => {
    it('denies unauthenticated requests', () => {
      const res = simulateSaveTimetableAccessCheck(null)
      assert.equal(res.allowed, false)
      assert.equal(res.error, 'Unauthorized session.')
    })

    it('denies STUDENT role from saving timetables', () => {
      const res = simulateSaveTimetableAccessCheck({ user: { id: 'usr-st-1', role: 'STUDENT', schoolId: 'sch-1' } })
      assert.equal(res.allowed, false)
      assert.equal(res.error, 'Forbidden: Insufficient permissions to modify timetable.')
    })

    it('denies PARENT role from saving timetables', () => {
      const res = simulateSaveTimetableAccessCheck({ user: { id: 'usr-pr-1', role: 'PARENT', schoolId: 'sch-1' } })
      assert.equal(res.allowed, false)
      assert.equal(res.error, 'Forbidden: Insufficient permissions to modify timetable.')
    })

    it('allows TEACHER, ADMIN, SCHOOL_ADMIN, and SUPER_ADMIN roles when school context is present', () => {
      for (const role of ALLOWED_TIMETABLE_ROLES) {
        if (role === 'SUPER_ADMIN') {
          assert.equal(simulateSaveTimetableAccessCheck({ user: { id: 'u1', role, schoolId: null } }, 'sch-1').allowed, true)
        } else {
          assert.equal(simulateSaveTimetableAccessCheck({ user: { id: 'u1', role, schoolId: 'sch-1' } }).allowed, true)
        }
      }
    })

    it('fails closed when any staff role lacks a valid schoolId target', () => {
      const res = simulateSaveTimetableAccessCheck({ user: { id: 'u1', role: 'TEACHER', schoolId: null } })
      assert.equal(res.allowed, false)
      assert.equal(res.error, 'School context (schoolId) is required to save timetable.')
    })

    it('prevents cross-school deletion by requiring explicit schoolId context for SUPER_ADMIN', () => {
      const resNoSchool = simulateSaveTimetableAccessCheck({ user: { id: 'sa-1', role: 'SUPER_ADMIN', schoolId: null } })
      assert.equal(resNoSchool.allowed, false)
      assert.equal(resNoSchool.error, 'School context (schoolId) is required to save timetable.')

      const resWithSchool = simulateSaveTimetableAccessCheck({ user: { id: 'sa-1', role: 'SUPER_ADMIN', schoolId: null } }, 'sch-target-123')
      assert.equal(resWithSchool.allowed, true)
    })
  })

  describe('Timetable Entry Input Validation & Parameter Clamping', () => {
    it('normalizes valid days of week and defaults invalid day strings to Monday', () => {
      const validEntry = validateAndSanitizeTimetableEntry({ dayOfWeek: 'tuesday' }, 'sch-1', 'SSS 1')
      assert.equal(validEntry.dayOfWeek, 'Tuesday')
      assert.equal(validEntry.schoolId, 'sch-1')
      assert.equal(validEntry.className, 'SSS 1')

      const invalidEntry = validateAndSanitizeTimetableEntry({ dayOfWeek: 'InvalidDayName' }, 'sch-1', 'SSS 1')
      assert.equal(invalidEntry.dayOfWeek, 'Monday')
    })

    it('clamps periodNumber between 1 and 20 for non-integer or out-of-bound inputs', () => {
      assert.equal(validateAndSanitizeTimetableEntry({ periodNumber: 3 }, 'sch-1', 'SSS 1').periodNumber, 3)
      assert.equal(validateAndSanitizeTimetableEntry({ periodNumber: 0 }, 'sch-1', 'SSS 1').periodNumber, 1)
      assert.equal(validateAndSanitizeTimetableEntry({ periodNumber: 25 }, 'sch-1', 'SSS 1').periodNumber, 1)
      assert.equal(validateAndSanitizeTimetableEntry({ periodNumber: NaN }, 'sch-1', 'SSS 1').periodNumber, 1)
    })

    it('sanitizes and trims string values with max length enforcement', () => {
      const longSubject = 'A'.repeat(150)
      const sanitized = validateAndSanitizeTimetableEntry({
        subjectName: longSubject,
        startTime: '  09:00 AM  ',
        endTime: '  09:40 AM  ',
        teacherName: '   Mr. Okonkwo   ',
        room: '   Room 4B   '
      }, 'sch-1', 'SSS 1')

      assert.equal(sanitized.subjectName.length, 100)
      assert.equal(sanitized.startTime, '09:00 AM')
      assert.equal(sanitized.endTime, '09:40 AM')
      assert.equal(sanitized.teacherName, 'Mr. Okonkwo')
      assert.equal(sanitized.room, 'Room 4B')
    })

    it('handles null / empty optional teacher and room fields gracefully', () => {
      const sanitized = validateAndSanitizeTimetableEntry({
        teacherName: '   ',
        room: ''
      }, 'sch-1', 'SSS 1')

      assert.equal(sanitized.teacherName, null)
      assert.equal(sanitized.room, null)
    })
  })
})
