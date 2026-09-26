import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

interface MockUser {
  id: string
  role: string
  schoolId: string | null
}

interface MockSession {
  user: MockUser
}

const SAVE_REPORT_CARD_ROLES = ['TEACHER', 'ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']
const ENDORSE_REJECT_ROLES = ['ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']

function canSaveReportCard(session: MockSession | null): boolean {
  if (!session?.user) return false
  return SAVE_REPORT_CARD_ROLES.includes(session.user.role)
}

function canEndorseOrRejectReportCard(session: MockSession | null): boolean {
  if (!session?.user) return false
  return ENDORSE_REJECT_ROLES.includes(session.user.role)
}

interface StudentProfile {
  id: string
  userId: string
  admissionNumber?: string | null
  parentId?: string | null
  schoolId?: string | null
}

interface ParentProfile {
  id: string
  userId: string
  schoolId?: string | null
}

interface MockDB {
  students: StudentProfile[]
  parents: ParentProfile[]
  reportCards: Array<{
    id: string
    studentId: string
    studentName: string
    className: string
  }>
}

function resolveAllowedStudentIds(
  session: MockSession | null,
  db: MockDB
): string[] {
  if (!session?.user) return []

  const { role, id: userId, schoolId: userSchoolId } = session.user

  if (role === 'STUDENT') {
    const studentProfile = db.students.find(s => s.userId === userId)
    if (!studentProfile) return []
    const ids = [studentProfile.id]
    if (studentProfile.admissionNumber) {
      ids.push(studentProfile.admissionNumber)
    }
    return ids
  }

  if (role === 'PARENT') {
    const parentProfile = db.parents.find(p => p.userId === userId)
    if (!parentProfile) return []
    const children = db.students.filter(s => s.parentId === parentProfile.id)
    if (!children.length) return []
    const ids: string[] = []
    for (const child of children) {
      if (child.id) ids.push(child.id)
      if (child.admissionNumber) ids.push(child.admissionNumber)
    }
    return ids
  }

  if (role === 'TEACHER' || role === 'ADMIN' || role === 'SCHOOL_ADMIN') {
    if (!userSchoolId) return []
    const schoolStudents = db.students.filter(s => s.schoolId === userSchoolId)
    if (!schoolStudents.length) return []
    const ids: string[] = []
    for (const s of schoolStudents) {
      if (s.id) ids.push(s.id)
      if (s.admissionNumber) ids.push(s.admissionNumber)
    }
    return ids
  }

  if (role === 'SUPER_ADMIN') {
    if (userSchoolId) {
      const schoolStudents = db.students.filter(s => s.schoolId === userSchoolId)
      if (!schoolStudents.length) return []
      const ids: string[] = []
      for (const s of schoolStudents) {
        if (s.id) ids.push(s.id)
        if (s.admissionNumber) ids.push(s.admissionNumber)
      }
      return ids
    } else {
      return db.reportCards.map(rc => rc.studentId)
    }
  }

  return []
}

describe('Report Cards Auth & Fail-Closed Tenant Isolation', () => {
  describe('saveReportCard Role Checks', () => {
    it('denies unauthenticated users', () => {
      assert.equal(canSaveReportCard(null), false)
    })

    it('denies STUDENT role from saving report cards', () => {
      assert.equal(canSaveReportCard({ user: { id: 'u1', role: 'STUDENT', schoolId: 'sch1' } }), false)
    })

    it('denies PARENT role from saving report cards', () => {
      assert.equal(canSaveReportCard({ user: { id: 'u2', role: 'PARENT', schoolId: 'sch1' } }), false)
    })

    it('allows TEACHER, ADMIN, SCHOOL_ADMIN, and SUPER_ADMIN to save report cards', () => {
      assert.equal(canSaveReportCard({ user: { id: 'u3', role: 'TEACHER', schoolId: 'sch1' } }), true)
      assert.equal(canSaveReportCard({ user: { id: 'u4', role: 'ADMIN', schoolId: 'sch1' } }), true)
      assert.equal(canSaveReportCard({ user: { id: 'u5', role: 'SCHOOL_ADMIN', schoolId: 'sch1' } }), true)
      assert.equal(canSaveReportCard({ user: { id: 'u6', role: 'SUPER_ADMIN', schoolId: null } }), true)
    })
  })

  describe('endorseReportCard / rejectReportCard Role Checks', () => {
    it('denies TEACHER role from endorsing or rejecting report cards', () => {
      assert.equal(canEndorseOrRejectReportCard({ user: { id: 'u3', role: 'TEACHER', schoolId: 'sch1' } }), false)
    })

    it('allows ADMIN, SCHOOL_ADMIN, and SUPER_ADMIN to endorse or reject report cards', () => {
      assert.equal(canEndorseOrRejectReportCard({ user: { id: 'u4', role: 'ADMIN', schoolId: 'sch1' } }), true)
      assert.equal(canEndorseOrRejectReportCard({ user: { id: 'u5', role: 'SCHOOL_ADMIN', schoolId: 'sch1' } }), true)
      assert.equal(canEndorseOrRejectReportCard({ user: { id: 'u6', role: 'SUPER_ADMIN', schoolId: null } }), true)
    })
  })

  describe('getReportCards Tenant Isolation & Student Scoping', () => {
    const mockDb: MockDB = {
      students: [
        { id: 'st-1', userId: 'usr-st-1', admissionNumber: 'ADM-001', parentId: 'pr-1', schoolId: 'sch-A' },
        { id: 'st-2', userId: 'usr-st-2', admissionNumber: 'ADM-002', parentId: 'pr-2', schoolId: 'sch-B' },
      ],
      parents: [
        { id: 'pr-1', userId: 'usr-pr-1', schoolId: 'sch-A' },
      ],
      reportCards: [
        { id: 'rc-1', studentId: 'st-1', studentName: 'Alice', className: 'JSS1' },
        { id: 'rc-2', studentId: 'st-2', studentName: 'Bob', className: 'SS1' },
      ],
    }

    it('returns empty array if unauthenticated', () => {
      const allowed = resolveAllowedStudentIds(null, mockDb)
      assert.deepEqual(allowed, [])
    })

    it('scopes STUDENT strictly to their own ID and admission number', () => {
      const allowed = resolveAllowedStudentIds({ user: { id: 'usr-st-1', role: 'STUDENT', schoolId: 'sch-A' } }, mockDb)
      assert.deepEqual(allowed, ['st-1', 'ADM-001'])
    })

    it('scopes PARENT strictly to their linked children IDs and admission numbers', () => {
      const allowed = resolveAllowedStudentIds({ user: { id: 'usr-pr-1', role: 'PARENT', schoolId: 'sch-A' } }, mockDb)
      assert.deepEqual(allowed, ['st-1', 'ADM-001'])
    })

    it('returns empty array for PARENT with no linked children', () => {
      const mockDbNoChildren = { ...mockDb, students: [] }
      const allowed = resolveAllowedStudentIds({ user: { id: 'usr-pr-1', role: 'PARENT', schoolId: 'sch-A' } }, mockDbNoChildren)
      assert.deepEqual(allowed, [])
    })

    it('scopes TEACHER and SCHOOL_ADMIN strictly to students in their school', () => {
      const allowed = resolveAllowedStudentIds({ user: { id: 'usr-tch-1', role: 'TEACHER', schoolId: 'sch-A' } }, mockDb)
      assert.deepEqual(allowed, ['st-1', 'ADM-001'])
    })

    it('fails closed when TEACHER or SCHOOL_ADMIN has missing schoolId', () => {
      const allowed = resolveAllowedStudentIds({ user: { id: 'usr-tch-1', role: 'TEACHER', schoolId: null } }, mockDb)
      assert.deepEqual(allowed, [])
    })

    it('allows global SUPER_ADMIN with no school filter to view all report card student IDs', () => {
      const allowed = resolveAllowedStudentIds({ user: { id: 'usr-sa', role: 'SUPER_ADMIN', schoolId: null } }, mockDb)
      assert.deepEqual(allowed, ['st-1', 'st-2'])
    })
  })
})
