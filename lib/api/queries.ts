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
  subject,
  message as messageTable,
  notification,
  cbtAttempt,
  learningMaterial,
  lessonNote
} from '@/lib/db/schema'
import { eq, and, sql, desc, inArray } from 'drizzle-orm'

export async function getStudentProfile(userId: string) {
  return await db.query.student.findFirst({
    where: eq(student.userId, userId),
  })
}

export async function getTeacherProfile(userId: string) {
  return await db.query.teacher.findFirst({
    where: eq(teacher.userId, userId),
  })
}

export async function getParentProfile(userId: string) {
  return await db.query.parent.findFirst({
    where: eq(parent.userId, userId),
  })
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
  const [pendingPaymentsCount] = await db.select({ count: sql<number>`count(*)` }).from(payment).where(eq(payment.status, 'pending'))

  return {
    totalStudents: Number(studentsCount?.count || 0),
    totalTeachers: Number(teachersCount?.count || 0),
    revenue: totalRevenue?.sum || '0',
    activeCBTs: Number(activeCBTs?.count || 0),
    pendingPaymentsCount: Number(pendingPaymentsCount?.count || 0)
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
  const classNames = classes.map(c => c.name)

  const studentCountResult = classNames.length > 0
    ? await db.select({ count: sql<number>`count(*)` })
        .from(student)
        .where(inArray(student.class, classNames))
    : [{ count: 0 }]

  const upcomingAssessments = await db.select()
    .from(assessment)
    .where(and(eq(assessment.createdBy, teacherId), eq(assessment.status, 'published')))
    .limit(5)

  const [lessonNotesCount] = await db.select({ count: sql<number>`count(*)` })
    .from(lessonNote)
    .where(eq(lessonNote.teacherId, teacherId))

  return {
    classes,
    totalStudents: Number(studentCountResult[0]?.count || 0),
    upcomingAssessments,
    lessonNotesCount: Number(lessonNotesCount?.count || 0)
  }
}

export async function getStudentDashboardData(studentId: string, className: string) {
  const upcomingAssessments = await db.select()
    .from(assessment)
    .innerJoin(subject, eq(assessment.subjectId, subject.id))
    .where(eq(assessment.status, 'published'))
    .limit(5)

  const [completedCBTsCount] = await db.select({ count: sql<number>`count(*)` })
    .from(cbtAttempt)
    .where(eq(cbtAttempt.studentId, studentId))

  const [materialCount] = await db.select({ count: sql<number>`count(*)` })
    .from(learningMaterial)

  const recentPayments = await db.select()
    .from(payment)
    .where(eq(payment.studentId, studentId))
    .orderBy(desc(payment.createdAt))
    .limit(5)

  return {
    upcomingAssessments: upcomingAssessments.map(a => ({ ...a.assessment, subject: a.subject.name })),
    recentPayments,
    completedCBTsCount: Number(completedCBTsCount?.count || 0),
    materialCount: Number(materialCount?.count || 0)
  }
}

export async function getParentDashboardData(parentId: string) {
  const children = await getParentChildren(parentId)
  const childIds = children.map(c => c.id)

  const pendingPayments = childIds.length > 0
    ? await db.select()
        .from(payment)
        .where(and(inArray(payment.studentId, childIds), eq(payment.status, 'pending')))
        .limit(5)
    : []

  const totalPendingAmount = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0)

  const recentMessages = await db.query.messageTable.findMany({
    orderBy: desc(messageTable.createdAt),
    limit: 5,
    with: {
       sender: true
    }
  })

  return {
    children,
    pendingPayments,
    totalPendingAmount,
    recentMessages
  }
}
