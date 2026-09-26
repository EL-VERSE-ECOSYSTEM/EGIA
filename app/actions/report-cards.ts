'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { reportCardTable, student, parent, teacher, user as userTable, schoolAdminRoles } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export type ReportCard = {
  id: string
  studentId: string
  studentName: string
  className: string
  marks: {
    subject: string
    testScore: number
    examScore: number
    total: number
    grade: string
  }[]
  teacherRemarks: string
  status: 'PENDING' | 'ENDORSED' | 'REJECTED'
  adminFeedback?: string | null
  term?: string | null
  session?: string | null
  endorsedAt?: string | null
  createdAt: string
}

export type AuthUser = {
  id: string
  role: string
  schoolId?: string | null
}

/**
 * Pure evaluation for report card creation permissions (fail-closed)
 */
export async function evaluateSavePermissions(user: AuthUser | null): Promise<{ allowed: boolean; error?: string }> {
  if (!user?.id) {
    return { allowed: false, error: 'Unauthorized' }
  }
  const role = (user.role || '').toUpperCase()
  if (!['TEACHER', 'ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return { allowed: false, error: 'Forbidden: Insufficient permissions to create report cards.' }
  }
  return { allowed: true }
}

/**
 * Pure evaluation for report card endorsement/rejection permissions and tenant scoping (fail-closed)
 */
export async function evaluateEndorsePermissions(
  user: AuthUser | null,
  cardStudentId: string,
  adminSchoolStudentIds?: Set<string>
): Promise<{ allowed: boolean; error?: string }> {
  if (!user?.id) {
    return { allowed: false, error: 'Unauthorized' }
  }
  const role = (user.role || '').toUpperCase()
  if (!['ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return { allowed: false, error: 'Forbidden: Administrative approval permissions required.' }
  }

  if (role !== 'SUPER_ADMIN') {
    if (!adminSchoolStudentIds || !adminSchoolStudentIds.has(cardStudentId)) {
      return { allowed: false, error: 'Unauthorized: Report card belongs to another tenant school or administrative context is missing.' }
    }
  }

  return { allowed: true }
}

/**
 * Resolves schoolId for administrative user
 */
export async function resolveAdminSchoolId(userId: string): Promise<string | null> {
  const uRec = await db.query.user.findFirst({ where: eq(userTable.id, userId) })
  if (uRec?.schoolId) return uRec.schoolId

  const adminRoleRec = await db.query.schoolAdminRoles.findFirst({
    where: eq(schoolAdminRoles.userId, userId),
  })
  return adminRoleRec?.schoolId || null
}

export async function getReportCards(): Promise<ReportCard[]> {
  try {
    const session = await auth.getSession()
    if (!session?.user?.id) return []

    const userId = session.user.id
    const userRole = (session.user.role || '').toUpperCase()

    // Super admin can access all report cards
    if (userRole === 'SUPER_ADMIN') {
      const results = await db.select().from(reportCardTable)
      return formatReportCards(results)
    }

    // Role: STUDENT / PUPIL
    if (userRole === 'STUDENT' || userRole === 'PUPIL') {
      const studentRec = await db.query.student.findFirst({
        where: eq(student.userId, userId)
      })

      const studentIds = new Set<string>([userId])
      if (studentRec) {
        if (studentRec.id) studentIds.add(studentRec.id)
        if (studentRec.admissionNumber) studentIds.add(studentRec.admissionNumber)
      }

      const idArray = Array.from(studentIds).filter(Boolean)
      if (idArray.length === 0) return []

      const results = await db
        .select()
        .from(reportCardTable)
        .where(inArray(reportCardTable.studentId, idArray))

      return formatReportCards(results)
    }

    // Role: PARENT
    if (userRole === 'PARENT') {
      const parentRec = await db.query.parent.findFirst({
        where: eq(parent.userId, userId)
      })

      if (!parentRec) return []

      const children = await db.query.student.findMany({
        where: eq(student.parentId, parentRec.id)
      })

      const childIds = new Set<string>()
      children.forEach(c => {
        if (c.id) childIds.add(c.id)
        if (c.userId) childIds.add(c.userId)
        if (c.admissionNumber) childIds.add(c.admissionNumber)
      })

      const idArray = Array.from(childIds).filter(Boolean)
      if (idArray.length === 0) return []

      const results = await db
        .select()
        .from(reportCardTable)
        .where(inArray(reportCardTable.studentId, idArray))

      return formatReportCards(results)
    }

    // Role: TEACHER
    if (userRole === 'TEACHER') {
      const teacherRec = await db.query.teacher.findFirst({
        where: eq(teacher.userId, userId)
      })
      const teacherSchoolId = teacherRec?.schoolId || session.user.schoolId

      // Fail closed if school context is missing
      if (!teacherSchoolId) return []

      const schoolStudents = await db.query.student.findMany({
        where: eq(student.schoolId, teacherSchoolId)
      })

      const studentIds = new Set<string>()
      schoolStudents.forEach(s => {
        if (s.id) studentIds.add(s.id)
        if (s.userId) studentIds.add(s.userId)
        if (s.admissionNumber) studentIds.add(s.admissionNumber)
      })

      const idArray = Array.from(studentIds).filter(Boolean)
      if (idArray.length === 0) return []

      const results = await db
        .select()
        .from(reportCardTable)
        .where(inArray(reportCardTable.studentId, idArray))

      return formatReportCards(results)
    }

    // Role: ADMIN / SCHOOL_ADMIN
    if (userRole === 'ADMIN' || userRole === 'SCHOOL_ADMIN') {
      const adminSchoolId = await resolveAdminSchoolId(userId)

      // Fail closed if school context is missing
      if (!adminSchoolId) return []

      const schoolStudents = await db.query.student.findMany({
        where: eq(student.schoolId, adminSchoolId)
      })

      const studentIds = new Set<string>()
      schoolStudents.forEach(s => {
        if (s.id) studentIds.add(s.id)
        if (s.userId) studentIds.add(s.userId)
        if (s.admissionNumber) studentIds.add(s.admissionNumber)
      })

      const idArray = Array.from(studentIds).filter(Boolean)
      if (idArray.length === 0) return []

      const results = await db
        .select()
        .from(reportCardTable)
        .where(inArray(reportCardTable.studentId, idArray))

      return formatReportCards(results)
    }

    return []
  } catch (err) {
    console.error('Failed to get report cards from DB:', err)
    return []
  }
}

function formatReportCards(results: any[]): ReportCard[] {
  return results.map(r => ({
    id: r.id,
    studentId: r.studentId,
    studentName: r.studentName,
    className: r.className,
    marks: r.marks as any,
    teacherRemarks: r.teacherRemarks || '',
    status: r.status as any,
    adminFeedback: r.adminFeedback || null,
    term: r.term || 'First Term',
    session: r.session || '2026/2027',
    endorsedAt: r.endorsedAt ? new Date(r.endorsedAt).toISOString() : null,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
  }))
}

export async function saveReportCard(data: Omit<ReportCard, 'id' | 'status' | 'createdAt'>): Promise<ReportCard> {
  const session = await auth.getSession()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const userRole = (session.user.role || '').toUpperCase()
  const saveCheck = await evaluateSavePermissions({ id: session.user.id, role: userRole })
  if (!saveCheck.allowed) {
    throw new Error(saveCheck.error || 'Forbidden')
  }

  const id = `card-${Date.now()}`
  const newCard: ReportCard = {
    ...data,
    id,
    status: 'PENDING',
    term: data.term || 'First Term',
    session: data.session || '2026/2027',
    createdAt: new Date().toISOString()
  }

  await db.insert(reportCardTable).values({
    id,
    studentId: data.studentId,
    studentName: data.studentName,
    className: data.className,
    marks: data.marks as any,
    teacherRemarks: data.teacherRemarks,
    status: 'PENDING',
    term: data.term || 'First Term',
    session: data.session || '2026/2027'
  })

  revalidatePath('/dashboard')
  return newCard
}

export async function endorseReportCard(id: string, feedback?: string): Promise<ReportCard> {
  const session = await auth.getSession()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const userRole = (session.user.role || '').toUpperCase()

  const existingCard = await db.query.reportCardTable.findFirst({
    where: eq(reportCardTable.id, id)
  })
  if (!existingCard) throw new Error('Report card not found')

  let adminSchoolStudentIds: Set<string> | undefined

  if (userRole !== 'SUPER_ADMIN') {
    const adminSchoolId = await resolveAdminSchoolId(session.user.id)
    if (!adminSchoolId) {
      throw new Error('Unauthorized: Administrative school context missing.')
    }

    const schoolStudents = await db.query.student.findMany({
      where: eq(student.schoolId, adminSchoolId)
    })

    adminSchoolStudentIds = new Set<string>()
    schoolStudents.forEach(s => {
      if (s.id) adminSchoolStudentIds!.add(s.id)
      if (s.userId) adminSchoolStudentIds!.add(s.userId)
      if (s.admissionNumber) adminSchoolStudentIds!.add(s.admissionNumber)
    })
  }

  const endorseCheck = await evaluateEndorsePermissions(
    { id: session.user.id, role: userRole },
    existingCard.studentId,
    adminSchoolStudentIds
  )

  if (!endorseCheck.allowed) {
    throw new Error(endorseCheck.error || 'Unauthorized')
  }

  const adminFeedback = feedback || 'Endorsed and approved by Academy Administration.'

  await db.update(reportCardTable)
    .set({
      status: 'ENDORSED',
      adminFeedback: adminFeedback,
      endorsedAt: new Date()
    })
    .where(eq(reportCardTable.id, id))

  const results = await db.select().from(reportCardTable).where(eq(reportCardTable.id, id)).limit(1)
  const r = results[0]
  if (!r) throw new Error('Report card not found')

  revalidatePath('/dashboard')
  return formatReportCards([r])[0]
}

export async function rejectReportCard(id: string, feedback: string): Promise<ReportCard> {
  const session = await auth.getSession()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const userRole = (session.user.role || '').toUpperCase()

  const existingCard = await db.query.reportCardTable.findFirst({
    where: eq(reportCardTable.id, id)
  })
  if (!existingCard) throw new Error('Report card not found')

  let adminSchoolStudentIds: Set<string> | undefined

  if (userRole !== 'SUPER_ADMIN') {
    const adminSchoolId = await resolveAdminSchoolId(session.user.id)
    if (!adminSchoolId) {
      throw new Error('Unauthorized: Administrative school context missing.')
    }

    const schoolStudents = await db.query.student.findMany({
      where: eq(student.schoolId, adminSchoolId)
    })

    adminSchoolStudentIds = new Set<string>()
    schoolStudents.forEach(s => {
      if (s.id) adminSchoolStudentIds!.add(s.id)
      if (s.userId) adminSchoolStudentIds!.add(s.userId)
      if (s.admissionNumber) adminSchoolStudentIds!.add(s.admissionNumber)
    })
  }

  const endorseCheck = await evaluateEndorsePermissions(
    { id: session.user.id, role: userRole },
    existingCard.studentId,
    adminSchoolStudentIds
  )

  if (!endorseCheck.allowed) {
    throw new Error(endorseCheck.error || 'Unauthorized')
  }

  await db.update(reportCardTable)
    .set({
      status: 'REJECTED',
      adminFeedback: feedback
    })
    .where(eq(reportCardTable.id, id))

  const results = await db.select().from(reportCardTable).where(eq(reportCardTable.id, id)).limit(1)
  const r = results[0]
  if (!r) throw new Error('Report card not found')

  revalidatePath('/dashboard')
  return formatReportCards([r])[0]
}
