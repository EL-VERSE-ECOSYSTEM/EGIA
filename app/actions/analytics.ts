'use server'

import { db } from '@/lib/db'
import { student, teacher, parent as parentTable, assessment, payment, assessmentResult, attendance } from '@/lib/db/schema'
import { eq, avg, sql, inArray } from 'drizzle-orm'

export async function getSchoolAnalytics() {
  const [studentsCount] = await db.select({ count: sql<number>`count(*)` }).from(student)
  const [teachersCount] = await db.select({ count: sql<number>`count(*)` }).from(teacher)
  const [parentsCount] = await db.select({ count: sql<number>`count(*)` }).from(parentTable)
  const payments = await db.query.payment.findMany()

  const totalRevenue = payments
    .filter(p => p.status === 'success')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  const successPayments = payments.filter(p => p.status === 'success').length
  const pendingPayments = payments.filter(p => p.status === 'pending').length

  return {
    totalStudents: Number(studentsCount?.count || 0),
    totalTeachers: Number(teachersCount?.count || 0),
    totalParents: Number(parentsCount?.count || 0),
    totalRevenue,
    completedPayments: successPayments,
    pendingPayments,
    paymentCompletionRate: (successPayments + pendingPayments) > 0
      ? (successPayments / (successPayments + pendingPayments)) * 100
      : 0,
  }
}

export async function generatePerformanceReport() {
  const students = await db.query.student.findMany()

  // Aggregate performance by class
  const classPerformance = await db.select({
    class: student.class,
    avgScore: avg(assessmentResult.percentage),
    studentCount: sql<number>`count(distinct ${student.id})`
  })
  .from(student)
  .leftJoin(assessmentResult, eq(student.id, assessmentResult.studentId))
  .groupBy(student.class)

  const performanceByClass: Record<string, any> = {}
  classPerformance.forEach(cp => {
    if (cp.class) {
      performanceByClass[cp.class] = {
        average: Number(cp.avgScore) || 0,
        studentCount: cp.studentCount
      }
    }
  })

  return {
    timestamp: new Date().toISOString(),
    totalStudents: students.length,
    performanceByClass,
  }
}

export async function generateFinancialReport() {
  const payments = await db.query.payment.findMany()

  const byType = {
    tuition: payments.filter(p => p.feeType === 'tuition' && p.status === 'success').reduce((s, p) => s + Number(p.amount), 0),
    development: payments.filter(p => p.feeType === 'development' && p.status === 'success').reduce((s, p) => s + Number(p.amount), 0),
    exam: payments.filter(p => p.feeType === 'exam' && p.status === 'success').reduce((s, p) => s + Number(p.amount), 0),
    sports: payments.filter(p => p.feeType === 'sports' && p.status === 'success').reduce((s, p) => s + Number(p.amount), 0),
    pta: payments.filter(p => p.feeType === 'pta' && p.status === 'success').reduce((s, p) => s + Number(p.amount), 0),
  }

  const totalCount = payments.length
  const successCount = payments.filter(p => p.status === 'success').length

  return {
    timestamp: new Date().toISOString(),
    totalCollected: Object.values(byType).reduce((a, b) => a + Number(b), 0),
    byFeeType: byType,
    pendingAmount: payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0),
    completionRate: totalCount > 0 ? Number(((successCount / totalCount) * 100).toFixed(2)) : 0,
  }
}
