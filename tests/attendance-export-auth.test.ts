import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const ALLOWED_ADMIN_ROLES = ['PRIMARY_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'SCHOOL_ADMIN']

interface SessionUser {
  id: string
  role: string
  schoolId: string | null
}

interface MockSession {
  user: SessionUser
}

function evaluateExportAuthorization(
  session: MockSession | null,
  querySchoolId: string | null
): { status: number; targetSchoolId?: string; error?: string } {
  if (!session?.user) {
    return { status: 401, error: 'Unauthorized session.' }
  }

  const userRoleStr = (session.user.role || '').toUpperCase()
  if (!ALLOWED_ADMIN_ROLES.includes(userRoleStr)) {
    return { status: 403, error: 'Forbidden: Insufficient privileges.' }
  }

  const sessionSchoolId = session.user.schoolId
  let targetSchoolId = sessionSchoolId

  if (userRoleStr === 'SUPER_ADMIN') {
    targetSchoolId = querySchoolId || sessionSchoolId
  } else if (querySchoolId && sessionSchoolId && querySchoolId !== sessionSchoolId) {
    return { status: 403, error: 'Forbidden: Access to specified school attendance is restricted.' }
  }

  if (!targetSchoolId) {
    return { status: 400, error: 'School ID required' }
  }

  return { status: 200, targetSchoolId }
}

describe('Admin Attendance Export Auth & Tenant Scoping', () => {
  it('should return 401 when session is null', () => {
    const res = evaluateExportAuthorization(null, 'school-123')
    assert.equal(res.status, 401)
    assert.equal(res.error, 'Unauthorized session.')
  })

  it('should return 403 for unauthorized roles like STUDENT or TEACHER', () => {
    const studentSession: MockSession = {
      user: { id: 'u1', role: 'STUDENT', schoolId: 'school-100' }
    }
    const resStudent = evaluateExportAuthorization(studentSession, 'school-100')
    assert.equal(resStudent.status, 403)
    assert.equal(resStudent.error, 'Forbidden: Insufficient privileges.')

    const teacherSession: MockSession = {
      user: { id: 'u2', role: 'TEACHER', schoolId: 'school-100' }
    }
    const resTeacher = evaluateExportAuthorization(teacherSession, 'school-100')
    assert.equal(resTeacher.status, 403)
  })

  it('should allow SCHOOL_ADMIN to access their own school attendance', () => {
    const adminSession: MockSession = {
      user: { id: 'u3', role: 'SCHOOL_ADMIN', schoolId: 'school-100' }
    }
    const res = evaluateExportAuthorization(adminSession, 'school-100')
    assert.equal(res.status, 200)
    assert.equal(res.targetSchoolId, 'school-100')
  })

  it('should deny SCHOOL_ADMIN from accessing another school attendance (IDOR attempt)', () => {
    const adminSession: MockSession = {
      user: { id: 'u3', role: 'SCHOOL_ADMIN', schoolId: 'school-100' }
    }
    const res = evaluateExportAuthorization(adminSession, 'school-999')
    assert.equal(res.status, 403)
    assert.equal(res.error, 'Forbidden: Access to specified school attendance is restricted.')
  })

  it('should allow SUPER_ADMIN to query any school attendance', () => {
    const superAdminSession: MockSession = {
      user: { id: 'u4', role: 'SUPER_ADMIN', schoolId: null }
    }
    const res = evaluateExportAuthorization(superAdminSession, 'school-999')
    assert.equal(res.status, 200)
    assert.equal(res.targetSchoolId, 'school-999')
  })
})
