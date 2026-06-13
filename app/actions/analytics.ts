'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { student, teacher, parent as parentTable, assessment, payment } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

async function getUserId() {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getSchoolAnalytics() {
  const students = await db.query.student.findMany()
  const teachers = await db.query.teacher.findMany()
  const parents = await db.query.parent.findMany()
  const payments = await db.query.payment.findMany()

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0)

  const completedPayments = payments.filter(p => p.status === 'completed').length
  const pendingPayments = payments.filter(p => p.status === 'pending').length

  return {
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalParents: parents.length,
    totalRevenue,
    completedPayments,
    pendingPayments,
    paymentCompletionRate: completedPayments / (completedPayments + pendingPayments) * 100 || 0,
  }
}

export async function getClassAnalytics(className: string) {
  const students = await db.query.student.findMany({
    where: eq(student.class, className),
  })

  const assessments = await db.query.assessment.findMany()

  return {
    className,
    totalStudents: students.length,
    totalAssessments: assessments.length,
    averageClassPerformance: 75, // Mock data
    attendance: 92, // Mock data
  }
}

export async function getTeacherAnalytics(teacherId: string) {
  const assessments = await db.query.assessment.findMany({
    where: eq(assessment.createdBy, teacherId),
  })

  return {
    totalAssessments: assessments.length,
    publishedAssessments: assessments.filter(a => a.status === 'published').length,
    draftAssessments: assessments.filter(a => a.status === 'draft').length,
    averageScore: 72, // Mock data
  }
}

export async function generatePerformanceReport() {
  const students = await db.query.student.findMany()
  
  return {
    timestamp: new Date().toISOString(),
    totalStudents: students.length,
    performanceByClass: {
      'JSS1A': { average: 75, pass: 28, fail: 2 },
      'JSS1B': { average: 78, pass: 30, fail: 0 },
      'JSS1C': { average: 72, pass: 25, fail: 5 },
    },
  }
}

export async function generateFinancialReport() {
  const payments = await db.query.payment.findMany()

  const byType = {
    tuition: payments.filter(p => p.feeType === 'tuition' && p.status === 'completed').reduce((s, p) => s + p.amount, 0),
    development: payments.filter(p => p.feeType === 'development' && p.status === 'completed').reduce((s, p) => s + p.amount, 0),
    exam: payments.filter(p => p.feeType === 'exam' && p.status === 'completed').reduce((s, p) => s + p.amount, 0),
    sports: payments.filter(p => p.feeType === 'sports' && p.status === 'completed').reduce((s, p) => s + p.amount, 0),
    pta: payments.filter(p => p.feeType === 'pta' && p.status === 'completed').reduce((s, p) => s + p.amount, 0),
  }

  return {
    timestamp: new Date().toISOString(),
    totalCollected: Object.values(byType).reduce((a, b) => a + b, 0),
    byFeeType: byType,
    pendingAmount: payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
    completionRate: (payments.filter(p => p.status === 'completed').length / payments.length * 100).toFixed(2) + '%',
  }
}
