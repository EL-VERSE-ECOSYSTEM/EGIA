import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const ALLOWED_SCHEDULE_POST_ROLES = ['TEACHER', 'ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']
const ALLOWED_SCHEDULE_GET_ROLES = ['TEACHER', 'ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'STUDENT']

interface SessionUser {
  id: string
  role: string
  schoolId: string | null
}

interface MockSession {
  user: SessionUser
}

interface AssessmentRecord {
  id: string
  schoolId: string | null
  createdBy: string
}

interface TeacherProfile {
  id: string
  userId: string
  schoolId: string | null
}

function evaluateSchedulePostAuthorization(
  session: MockSession | null,
  assessment: AssessmentRecord | null,
  teacherProfile: TeacherProfile | null
): { status: number; error?: string; allowed?: boolean } {
  if (!session?.user) {
    return { status: 401, error: 'Unauthorized session.' }
  }

  const role = (session.user.role || '').toUpperCase()
  if (!ALLOWED_SCHEDULE_POST_ROLES.includes(role)) {
    return { status: 403, error: 'Forbidden: Insufficient permissions.' }
  }

  if (!assessment) {
    return { status: 404, error: 'Assessment record not found.' }
  }

  if (role !== 'SUPER_ADMIN') {
    const userSchoolId = session.user.schoolId

    if (role === 'TEACHER') {
      const teacherSchoolId = teacherProfile?.schoolId || userSchoolId
      const isCreator = teacherProfile && assessment.createdBy === teacherProfile.id
      const isSameSchool = assessment.schoolId && teacherSchoolId && assessment.schoolId === teacherSchoolId

      if (!isCreator && !isSameSchool) {
        return { status: 403, error: 'Forbidden: You do not have permission to schedule this assessment.' }
      }
    } else {
      // ADMIN / SCHOOL_ADMIN
      if (assessment.schoolId && assessment.schoolId !== userSchoolId) {
        return { status: 403, error: 'Forbidden: Assessment belongs to a different school tenant.' }
      }
    }
  }

  return { status: 200, allowed: true }
}

function evaluateScheduleGetAuthorization(
  session: MockSession | null,
  querySchoolId: string | null
): { status: number; targetSchoolId?: string | null; error?: string } {
  if (!session?.user) {
    return { status: 401, error: 'Unauthorized session.' }
  }

  const role = (session.user.role || '').toUpperCase()
  if (!ALLOWED_SCHEDULE_GET_ROLES.includes(role)) {
    return { status: 403, error: 'Forbidden: Insufficient permissions.' }
  }

  if (role === 'SUPER_ADMIN') {
    return { status: 200, targetSchoolId: querySchoolId || null }
  }

  return { status: 200, targetSchoolId: session.user.schoolId || null }
}

describe('Assessment Schedule Auth & Tenant Scoping', () => {
  describe('POST /api/teacher/assessments/schedule', () => {
    it('should return 401 when unauthenticated', () => {
      const res = evaluateSchedulePostAuthorization(null, null, null)
      assert.equal(res.status, 401)
      assert.equal(res.error, 'Unauthorized session.')
    })

    it('should return 403 for unauthorized roles like PARENT or PUPIL', () => {
      const parentSession: MockSession = {
        user: { id: 'u1', role: 'PARENT', schoolId: 'school-a' }
      }
      const res = evaluateSchedulePostAuthorization(parentSession, { id: 'asm-1', schoolId: 'school-a', createdBy: 't1' }, null)
      assert.equal(res.status, 403)
      assert.equal(res.error, 'Forbidden: Insufficient permissions.')
    })

    it('should return 403 when SCHOOL_ADMIN attempts to schedule another school assessment (IDOR attempt)', () => {
      const adminSession: MockSession = {
        user: { id: 'u2', role: 'SCHOOL_ADMIN', schoolId: 'school-a' }
      }
      const assessmentOtherSchool: AssessmentRecord = {
        id: 'asm-b',
        schoolId: 'school-b',
        createdBy: 't-b'
      }
      const res = evaluateSchedulePostAuthorization(adminSession, assessmentOtherSchool, null)
      assert.equal(res.status, 403)
      assert.equal(res.error, 'Forbidden: Assessment belongs to a different school tenant.')
    })

    it('should return 403 when TEACHER attempts to schedule another school assessment not created by them', () => {
      const teacherSession: MockSession = {
        user: { id: 'u-teacher-a', role: 'TEACHER', schoolId: 'school-a' }
      }
      const teacherProfile: TeacherProfile = {
        id: 'prof-teacher-a',
        userId: 'u-teacher-a',
        schoolId: 'school-a'
      }
      const crossSchoolAssessment: AssessmentRecord = {
        id: 'asm-b',
        schoolId: 'school-b',
        createdBy: 'prof-teacher-b'
      }
      const res = evaluateSchedulePostAuthorization(teacherSession, crossSchoolAssessment, teacherProfile)
      assert.equal(res.status, 403)
      assert.equal(res.error, 'Forbidden: You do not have permission to schedule this assessment.')
    })

    it('should allow TEACHER to schedule assessment in their own school', () => {
      const teacherSession: MockSession = {
        user: { id: 'u-teacher-a', role: 'TEACHER', schoolId: 'school-a' }
      }
      const teacherProfile: TeacherProfile = {
        id: 'prof-teacher-a',
        userId: 'u-teacher-a',
        schoolId: 'school-a'
      }
      const sameSchoolAssessment: AssessmentRecord = {
        id: 'asm-a',
        schoolId: 'school-a',
        createdBy: 'prof-teacher-a'
      }
      const res = evaluateSchedulePostAuthorization(teacherSession, sameSchoolAssessment, teacherProfile)
      assert.equal(res.status, 200)
      assert.equal(res.allowed, true)
    })
  })

  describe('GET /api/teacher/assessments/schedule', () => {
    it('should return 401 when unauthenticated', () => {
      const res = evaluateScheduleGetAuthorization(null, 'school-a')
      assert.equal(res.status, 401)
    })

    it('should scope queries to user schoolId for non-SUPER_ADMIN users', () => {
      const teacherSession: MockSession = {
        user: { id: 'u-teacher', role: 'TEACHER', schoolId: 'school-a' }
      }
      const res = evaluateScheduleGetAuthorization(teacherSession, 'school-b')
      assert.equal(res.status, 200)
      assert.equal(res.targetSchoolId, 'school-a')
    })

    it('should allow SUPER_ADMIN to query target school', () => {
      const superAdminSession: MockSession = {
        user: { id: 'u-super', role: 'SUPER_ADMIN', schoolId: null }
      }
      const res = evaluateScheduleGetAuthorization(superAdminSession, 'school-b')
      assert.equal(res.status, 200)
      assert.equal(res.targetSchoolId, 'school-b')
    })
  })
})
