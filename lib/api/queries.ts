import { db } from '@/lib/db'
import {
  student,
  parent,
  teacher,
  userRole,
  class_,
  assessment,
  payment,
  auditLog,
  attendance,
  dispute,
  subject
} from '@/lib/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'

export async function getStudentProfile(userId: string) {
  const result = await db.select()
    .from(student)
    .where(eq(student.userId, userId))
    .limit(1)
  return result[0]
}

export async function getTeacherProfile(userId: string) {
  const result = await db.select()
    .from(teacher)
    .where(eq(teacher.userId, userId))
    .limit(1)
  return result[0]
}

export async function getParentProfile(userId: string) {
  const result = await db.select()
    .from(parent)
    .where(eq(parent.userId, userId))
    .limit(1)
  return result[0]
}

export async function getUserRole(userId: string) {
  const result = await db.select()
    .from(userRole)
    .where(eq(userRole.userId, userId))
    .limit(1)
  return result[0]?.role
}

export async function getParentChildren(parentId: string) {
  return await db.select()
    .from(student)
    .where(eq(student.parentId, parentId))
}

export async function getTeacherClasses(teacherId: string) {
  return await db.select()
    .from(class_)
    .where(eq(class_.teacherId, teacherId))
}

export async function getAdminDashboardStats() {
  const [studentsCount] = await db.select({ count: sql<number>`count(*)` }).from(student)
  const [teachersCount] = await db.select({ count: sql<number>`count(*)` }).from(teacher)
  const [totalRevenue] = await db.select({ sum: sql<string>`sum(amount)` }).from(payment).where(eq(payment.status, 'success'))
  const [activeCBTs] = await db.select({ count: sql<number>`count(*)` }).from(assessment).where(eq(assessment.status, 'published'))

  return {
    totalStudents: studentsCount.count,
    totalTeachers: teachersCount.count,
    revenue: totalRevenue.sum || '0',
    activeCBTs: activeCBTs.count
  }
}

export async function getRecentAuditLogs(limit = 5) {
  return await db.select()
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(limit)
}

export async function getUrgentAlerts() {
  const openDisputes = await db.select().from(dispute).where(eq(dispute.status, 'OPEN')).limit(3)
  return openDisputes.map(d => ({
    title: d.title,
    desc: d.description,
    priority: d.priority
  }))
}

export async function getTeacherDashboardData(teacherId: string) {
  const classes = await getTeacherClasses(teacherId)
  const [studentCount] = await db.select({ count: sql<number>`count(*)` })
    .from(student)
    .where(sql`class IN (select name from class where teacher_id = ${teacherId})`)

  const upcomingAssessments = await db.select()
    .from(assessment)
    .where(and(eq(assessment.createdBy, teacherId), eq(assessment.status, 'published')))
    .limit(5)

  return {
    classes,
    totalStudents: studentCount.count,
    upcomingAssessments
  }
}

export async function getStudentDashboardData(studentId: string, className: string) {
  const upcomingAssessments = await db.select()
    .from(assessment)
    .innerJoin(subject, eq(assessment.subjectId, subject.id))
    .where(eq(assessment.status, 'published'))
    .limit(5)

  const recentPayments = await db.select()
    .from(payment)
    .where(eq(payment.studentId, studentId))
    .orderBy(desc(payment.createdAt))
    .limit(5)

  return {
    upcomingAssessments: upcomingAssessments.map(a => ({ ...a.assessment, subject: a.subject.name })),
    recentPayments
  }
}
