import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  evaluateSavePermissions,
  evaluateEndorsePermissions,
  AuthUser
} from '../app/actions/report-cards'

describe('Report Cards Authorization & Scoping Server Action Logic', () => {
  describe('evaluateSavePermissions', () => {
    it('denies unauthenticated user (null user session)', async () => {
      const res = await evaluateSavePermissions(null)
      assert.equal(res.allowed, false)
      assert.equal(res.error, 'Unauthorized')
    })

    it('denies STUDENT or PARENT role from saving report cards', async () => {
      const studentRes = await evaluateSavePermissions({ id: 's1', role: 'STUDENT' })
      assert.equal(studentRes.allowed, false)
      assert.equal(studentRes.error, 'Forbidden: Insufficient permissions to create report cards.')

      const parentRes = await evaluateSavePermissions({ id: 'p1', role: 'PARENT' })
      assert.equal(parentRes.allowed, false)
      assert.equal(parentRes.error, 'Forbidden: Insufficient permissions to create report cards.')
    })

    it('allows TEACHER, SCHOOL_ADMIN, ADMIN, and SUPER_ADMIN to save report cards', async () => {
      const teacherRes = await evaluateSavePermissions({ id: 't1', role: 'TEACHER' })
      assert.equal(teacherRes.allowed, true)

      const adminRes = await evaluateSavePermissions({ id: 'a1', role: 'SCHOOL_ADMIN' })
      assert.equal(adminRes.allowed, true)

      const superAdminRes = await evaluateSavePermissions({ id: 'sa1', role: 'SUPER_ADMIN' })
      assert.equal(superAdminRes.allowed, true)
    })
  })

  describe('evaluateEndorsePermissions', () => {
    it('denies unauthenticated user', async () => {
      const res = await evaluateEndorsePermissions(null, 'student-100')
      assert.equal(res.allowed, false)
      assert.equal(res.error, 'Unauthorized')
    })

    it('denies TEACHER, STUDENT, or PARENT from endorsing report cards', async () => {
      const teacherRes = await evaluateEndorsePermissions({ id: 't1', role: 'TEACHER' }, 'student-100')
      assert.equal(teacherRes.allowed, false)
      assert.equal(teacherRes.error, 'Forbidden: Administrative approval permissions required.')

      const studentRes = await evaluateEndorsePermissions({ id: 's1', role: 'STUDENT' }, 'student-100')
      assert.equal(studentRes.allowed, false)
      assert.equal(studentRes.error, 'Forbidden: Administrative approval permissions required.')
    })

    it('fails closed when administrative school context or student match is missing', async () => {
      const schoolAdmin: AuthUser = { id: 'admin1', role: 'SCHOOL_ADMIN', schoolId: 'school-A' }

      // Undefined school student set (missing school context)
      const res1 = await evaluateEndorsePermissions(schoolAdmin, 'student-100', undefined)
      assert.equal(res1.allowed, false)
      assert.equal(res1.error, 'Unauthorized: Report card belongs to another tenant school or administrative context is missing.')

      // Mismatched school student set (student belongs to another tenant)
      const schoolBStudents = new Set(['student-200', 'student-201'])
      const res2 = await evaluateEndorsePermissions(schoolAdmin, 'student-100', schoolBStudents)
      assert.equal(res2.allowed, false)
      assert.equal(res2.error, 'Unauthorized: Report card belongs to another tenant school or administrative context is missing.')
    })

    it('allows SCHOOL_ADMIN when target student belongs to admin school', async () => {
      const schoolAdmin: AuthUser = { id: 'admin1', role: 'SCHOOL_ADMIN', schoolId: 'school-A' }
      const schoolAStudents = new Set(['student-100', 'student-101'])

      const res = await evaluateEndorsePermissions(schoolAdmin, 'student-100', schoolAStudents)
      assert.equal(res.allowed, true)
    })

    it('allows SUPER_ADMIN across all schools regardless of student set', async () => {
      const superAdmin: AuthUser = { id: 'super1', role: 'SUPER_ADMIN' }
      const res = await evaluateEndorsePermissions(superAdmin, 'student-999', undefined)
      assert.equal(res.allowed, true)
    })
  })
})
