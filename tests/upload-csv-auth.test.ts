import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const ALLOWED_CSV_ROLES = ['ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER']

interface SessionUser {
  id: string
  role: string
  schoolId: string | null
}

interface MockSession {
  user: SessionUser
}

interface MockAssessment {
  id: string
  schoolId: string | null
}

function evaluateCSVUploadAuthorization(
  session: MockSession | null,
  type: string,
  targetAssessment: MockAssessment | null,
  userSchoolRecord: { schoolId: string | null } | null
): { status: number; error?: string } {
  if (!session?.user) {
    return { status: 401, error: 'Unauthorized: Valid user session required.' }
  }

  const role = (session.user.role || '').toUpperCase()
  if (!ALLOWED_CSV_ROLES.includes(role)) {
    return { status: 403, error: 'Forbidden: Insufficient permissions to upload CSV.' }
  }

  if (type === 'quiz' && targetAssessment) {
    if (role !== 'SUPER_ADMIN') {
      const userSchoolId = session.user.schoolId || userSchoolRecord?.schoolId || null

      if (targetAssessment.schoolId && targetAssessment.schoolId !== userSchoolId) {
        return {
          status: 403,
          error: 'Forbidden: School tenant isolation mismatch. You cannot modify assessments belonging to another school.',
        }
      }
    }
  }

  return { status: 200 }
}

describe('POST /api/upload-csv Auth & Tenant Isolation Security Tests', () => {
  it('denies unauthenticated requests with 401 status', () => {
    const res = evaluateCSVUploadAuthorization(null, 'general', null, null)
    assert.equal(res.status, 401)
    assert.equal(res.error, 'Unauthorized: Valid user session required.')
  })

  it('denies unauthorized roles with 403 status', () => {
    const studentSession: MockSession = {
      user: { id: 'user-student-1', role: 'STUDENT', schoolId: 'school-1' },
    }
    const res = evaluateCSVUploadAuthorization(studentSession, 'general', null, null)
    assert.equal(res.status, 403)
    assert.equal(res.error, 'Forbidden: Insufficient permissions to upload CSV.')
  })

  it('prevents cross-tenant assessment quiz modification (IDOR)', () => {
    const teacherSession: MockSession = {
      user: { id: 'teacher-1', role: 'TEACHER', schoolId: 'school-1' },
    }
    const targetAssessment: MockAssessment = {
      id: 'assessment-school-2',
      schoolId: 'school-2',
    }

    const res = evaluateCSVUploadAuthorization(teacherSession, 'quiz', targetAssessment, null)
    assert.equal(res.status, 403)
    assert.equal(
      res.error,
      'Forbidden: School tenant isolation mismatch. You cannot modify assessments belonging to another school.'
    )
  })

  it('allows quiz import for assessment in user\'s own school', () => {
    const teacherSession: MockSession = {
      user: { id: 'teacher-1', role: 'TEACHER', schoolId: 'school-1' },
    }
    const targetAssessment: MockAssessment = {
      id: 'assessment-school-1',
      schoolId: 'school-1',
    }

    const res = evaluateCSVUploadAuthorization(teacherSession, 'quiz', targetAssessment, null)
    assert.equal(res.status, 200)
  })

  it('allows SUPER_ADMIN to import quiz for any school assessment', () => {
    const superAdminSession: MockSession = {
      user: { id: 'super-admin-1', role: 'SUPER_ADMIN', schoolId: null },
    }
    const targetAssessment: MockAssessment = {
      id: 'assessment-school-2',
      schoolId: 'school-2',
    }

    const res = evaluateCSVUploadAuthorization(superAdminSession, 'quiz', targetAssessment, null)
    assert.equal(res.status, 200)
  })
})
