'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { student, teacher, parent as parentTable, assessment, payment, assessmentResult, attendance } from '@/lib/db/schema'
import { eq, avg, sql, inArray } from 'drizzle-orm'
import { headers } from 'next/headers'

export async function getSchoolAnalytics() {
  const students = await db.query.student.findMany()
  const teachers = await db.query.teacher.findMany()
  const parents = await db.query.parent.findMany()
  const payments = await db.query.payment.findMany()

  const totalRevenue = payments
    .filter(p => p.status === 'completed' || p.status === 'success')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)

  const completedPayments = payments.filter(p => p.status === 'completed' || p.status === 'success').length
  const pendingPayments = payments.filter(p => p.status === 'pending').length

  return {
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalParents: parents.length,
    totalRevenue,
    completedPayments,
    pendingPayments,
    paymentCompletionRate: (completedPayments + pendingPayments) > 0
      ? (completedPayments / (completedPayments + pendingPayments)) * 100
      : 0,
  }
}

export async function getClassAnalytics(className: string) {
  const classStudents = await db.query.student.findMany({
    where: eq(student.class, className),
  })

  const studentIds = classStudents.map(s => s.id)
  const assessments = await db.query.assessment.findMany()

  let averageClassPerformance = 0
  let classAttendance = 0

  if (studentIds.length > 0) {
    const results = await db.select({
      avg: avg(assessmentResult.score)
    })
    .from(assessmentResult)
    .where(inArray(assessmentResult.studentId, studentIds))

    averageClassPerformance = Number(results[0]?.avg) || 0

    const attendanceRecords = await db.select({
      total: sql<number>`count(*)`,
      present: sql<number>`count(*) filter (where status = 'present')`
    })
    .from(attendance)
    .where(inArray(attendance.studentId, studentIds))

    if (attendanceRecords[0] && Number(attendanceRecords[0].total) > 0) {
      classAttendance = (Number(attendanceRecords[0].present) / Number(attendanceRecords[0].total)) * 100
    }
  }

  return {
    className,
    totalStudents: classStudents.length,
    totalAssessments: assessments.length,
    averageClassPerformance,
    attendance: classAttendance,
  }
}

export async function getTeacherAnalytics(teacherId: string) {
  const assessments = await db.query.assessment.findMany({
    where: eq(assessment.createdBy, teacherId),
  })

  const assessmentIds = assessments.map(a => a.id)
  let averageScore = 0

  if (assessmentIds.length > 0) {
    const results = await db.select({
      avg: avg(assessmentResult.score)
    })
    .from(assessmentResult)
    .where(inArray(assessmentResult.assessmentId, assessmentIds))

    averageScore = Number(results[0]?.avg) || 0
  }

  return {
    totalAssessments: assessments.length,
    publishedAssessments: assessments.filter(a => a.status === 'published').length,
    draftAssessments: assessments.filter(a => a.status === 'draft').length,
    averageScore,
  }
}

export async function generatePerformanceReport() {
  const students = await db.query.student.findMany()
  const results = await db.query.assessmentResult.findMany()

  // Group students by class
  const classGroups: Record<string, string[]> = {}
  students.forEach(s => {
    if (s.class) {
      if (!classGroups[s.class]) classGroups[s.class] = []
      classGroups[s.class].push(s.id)
    }
  })

  const performanceByClass: Record<string, any> = {}

  for (const [className, studentIds] of Object.entries(classGroups)) {
    const classResults = results.filter(r => studentIds.includes(r.studentId))
    const totalResults = classResults.length

    if (totalResults > 0) {
      const avgScore = classResults.reduce((sum, r) => sum + Number((r as any).score || 0), 0) / totalResults
      const pass = classResults.filter(r => Number((r as any).score || 0) >= 50).length
      const fail = totalResults - pass

      performanceByClass[className] = {
        average: Number(avgScore.toFixed(2)),
        pass,
        fail
      }
    } else {
      performanceByClass[className] = { average: 0, pass: 0, fail: 0 }
    }
  }

  // Ensure at least some classes are present for visualization if DB is empty
  if (Object.keys(performanceByClass).length === 0) {
    performanceByClass['JSS1A'] = { average: 0, pass: 0, fail: 0 }
  }

  return {
    timestamp: new Date().toISOString(),
    totalStudents: students.length,
    performanceByClass,
  }
}

export async function generateFinancialReport() {
  const payments = await db.query.payment.findMany()

  const byType = {
    tuition: payments.filter(p => p.feeType === 'tuition' && (p.status === 'completed' || p.status === 'success')).reduce((s, p) => s + Number(p.amount || 0), 0),
    development: payments.filter(p => p.feeType === 'development' && (p.status === 'completed' || p.status === 'success')).reduce((s, p) => s + Number(p.amount || 0), 0),
    exam: payments.filter(p => p.feeType === 'exam' && (p.status === 'completed' || p.status === 'success')).reduce((s, p) => s + Number(p.amount || 0), 0),
    sports: payments.filter(p => p.feeType === 'sports' && (p.status === 'completed' || p.status === 'success')).reduce((s, p) => s + Number(p.amount || 0), 0),
    pta: payments.filter(p => p.feeType === 'pta' && (p.status === 'completed' || p.status === 'success')).reduce((s, p) => s + Number(p.amount || 0), 0),
  }

  const totalCount = payments.length
  const completedCount = payments.filter(p => p.status === 'completed' || p.status === 'success').length

  return {
    timestamp: new Date().toISOString(),
    totalCollected: Object.values(byType).reduce((a, b) => a + Number(b), 0),
    byFeeType: byType,
    pendingAmount: payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount || 0), 0),
    completionRate: totalCount > 0 ? `${((completedCount / totalCount) * 100).toFixed(2)}%` : '0%',
  }
}
