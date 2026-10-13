'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { reportCardTable, student, parent, teacher } from '@/lib/db/schema'
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

export async function getReportCards(): Promise<ReportCard[]> {
  try {
    const session = await auth.getSession()
    if (!session?.user) {
      return []
    }

    const role = session.user.role
    const userId = session.user.id
    const userSchoolId = session.user.schoolId

    let allowedStudentIds: string[] = []

    if (role === 'STUDENT') {
      const studentProfile = await db.query.student.findFirst({
        where: eq(student.userId, userId)
      })
      if (!studentProfile) {
        return []
      }
      allowedStudentIds = [studentProfile.id]
      if (studentProfile.admissionNumber) {
        allowedStudentIds.push(studentProfile.admissionNumber)
      }
    } else if (role === 'PARENT') {
      const parentProfile = await db.query.parent.findFirst({
        where: eq(parent.userId, userId)
      })
      if (!parentProfile) {
        return []
      }
      const children = await db.select({
        id: student.id,
        admissionNumber: student.admissionNumber
      })
      .from(student)
      .where(eq(student.parentId, parentProfile.id))

      if (!children.length) {
        return []
      }

      for (const child of children) {
        if (child.id) allowedStudentIds.push(child.id)
        if (child.admissionNumber) allowedStudentIds.push(child.admissionNumber)
      }
    } else if (role === 'TEACHER' || role === 'ADMIN' || role === 'SCHOOL_ADMIN') {
      if (!userSchoolId) {
        return []
      }
      const schoolStudents = await db.select({
        id: student.id,
        admissionNumber: student.admissionNumber
      })
      .from(student)
      .where(eq(student.schoolId, userSchoolId))

      if (!schoolStudents.length) {
        return []
      }

      for (const s of schoolStudents) {
        if (s.id) allowedStudentIds.push(s.id)
        if (s.admissionNumber) allowedStudentIds.push(s.admissionNumber)
      }
    } else if (role === 'SUPER_ADMIN') {
      if (userSchoolId) {
        const schoolStudents = await db.select({
          id: student.id,
          admissionNumber: student.admissionNumber
        })
        .from(student)
        .where(eq(student.schoolId, userSchoolId))

        if (!schoolStudents.length) {
          return []
        }

        for (const s of schoolStudents) {
          if (s.id) allowedStudentIds.push(s.id)
          if (s.admissionNumber) allowedStudentIds.push(s.admissionNumber)
        }
      } else {
        // Super Admin with no school filter gets all report cards
        const results = await db.select().from(reportCardTable)
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
          endorsedAt: r.endorsedAt ? r.endorsedAt.toISOString() : null,
          createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString()
        }))
      }
    } else {
      return []
    }

    if (!allowedStudentIds.length) {
      return []
    }

    const results = await db
      .select()
      .from(reportCardTable)
      .where(inArray(reportCardTable.studentId, allowedStudentIds))

    // Enforce School Admin approval on Report Cards before Student & Parent visibility
    const filteredResults = (role === 'STUDENT' || role === 'PARENT')
      ? results.filter(r => r.status === 'ENDORSED')
      : results

    return filteredResults.map(r => ({
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
      endorsedAt: r.endorsedAt ? r.endorsedAt.toISOString() : null,
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString()
    }))
  } catch (err) {
    console.error('Failed to get report cards from DB:', err)
    return []
  }
}

export async function saveReportCard(data: Omit<ReportCard, 'id' | 'status' | 'createdAt'>): Promise<ReportCard> {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const allowedRoles = ['TEACHER', 'ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('Forbidden: Insufficient permissions to save report cards')
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
  if (!session?.user) throw new Error('Unauthorized')

  const allowedRoles = ['ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('Forbidden: Insufficient permissions to endorse report cards')
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
  return {
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
    endorsedAt: r.endorsedAt ? r.endorsedAt.toISOString() : null,
    createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString()
  }
}

export async function rejectReportCard(id: string, feedback: string): Promise<ReportCard> {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const allowedRoles = ['ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN']
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('Forbidden: Insufficient permissions to reject report cards')
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
  return {
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
    endorsedAt: r.endorsedAt ? r.endorsedAt.toISOString() : null,
    createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString()
  }
}
