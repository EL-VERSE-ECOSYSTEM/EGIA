'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { student, teacher, assessment, assessmentResult, attendance, subject, class_ } from '@/lib/db/schema'
import { eq, and, avg, sql, inArray } from 'drizzle-orm'

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

export async function getTeacherAnalytics() {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'TEACHER') {
    throw new Error('Unauthorized')
  }

  const teacherProfile = await db.query.teacher.findFirst({
    where: eq(teacher.userId, session.user.id),
  })
  if (!teacherProfile?.schoolId || teacherProfile.isActive === false) {
    throw new Error('Active teacher school profile not found')
  }

  const rows = await db.select({
    assessmentId: assessment.id,
    status: assessment.status,
    subjectId: subject.id,
    subjectName: subject.name,
    averageScore: sql<number | null>`avg(case when ${student.id} is not null then ${assessmentResult.score} end)`,
    submissions: sql<number>`count(${student.id})`,
    lastSubmission: sql<Date | null>`max(case when ${student.id} is not null then ${assessmentResult.createdAt} end)`,
  })
    .from(assessment)
    .innerJoin(subject, eq(subject.id, assessment.subjectId))
    .leftJoin(assessmentResult, eq(assessmentResult.assessmentId, assessment.id))
    .leftJoin(student, and(
      eq(student.id, assessmentResult.studentId),
      eq(student.schoolId, teacherProfile.schoolId),
    ))
    .where(and(
      eq(assessment.createdBy, teacherProfile.id),
      eq(assessment.schoolId, teacherProfile.schoolId),
    ))
    .groupBy(assessment.id, assessment.status, subject.id, subject.name)

  const subjects = new Map<string, {
    id: string
    name: string
    assessments: number
    submissions: number
    weightedScore: number
    lastSubmission: Date | null
  }>()

  let totalSubmissions = 0
  let totalWeightedScore = 0
  for (const row of rows) {
    const submissions = Number(row.submissions) || 0
    const score = Number(row.averageScore) || 0
    const summary = subjects.get(row.subjectId) || {
      id: row.subjectId,
      name: row.subjectName,
      assessments: 0,
      submissions: 0,
      weightedScore: 0,
      lastSubmission: null,
    }
    summary.assessments += 1
    summary.submissions += submissions
    summary.weightedScore += score * submissions
    if (row.lastSubmission && (!summary.lastSubmission || row.lastSubmission > summary.lastSubmission)) {
      summary.lastSubmission = row.lastSubmission
    }
    subjects.set(row.subjectId, summary)
    totalSubmissions += submissions
    totalWeightedScore += score * submissions
  }

  const subjectSummaries = Array.from(subjects.values())
    .map(({ weightedScore, ...summary }) => ({
      ...summary,
      averageScore: summary.submissions ? weightedScore / summary.submissions : 0,
    }))
    .sort((left, right) => right.averageScore - left.averageScore || left.name.localeCompare(right.name))

  const classes = await db.select({ id: class_.id, name: class_.name })
    .from(class_)
    .where(and(
      eq(class_.teacherId, teacherProfile.id),
      eq(class_.schoolId, teacherProfile.schoolId),
    ))
  const classNames = Array.from(new Set(classes.map(item => item.name)))

  const [studentCounts, classScores, attendanceRows, growthRows] = classNames.length
    ? await Promise.all([
      db.select({ className: student.class, totalStudents: sql<number>`count(*)` })
        .from(student)
        .where(and(eq(student.schoolId, teacherProfile.schoolId), inArray(student.class, classNames)))
        .groupBy(student.class),
      db.select({
        className: student.class,
        submissions: sql<number>`count(${student.id})`,
        averageScore: sql<number | null>`avg(${assessmentResult.score})`,
        passed: sql<number>`count(*) filter (where ${assessmentResult.score} >= 50)`,
      })
        .from(assessmentResult)
        .innerJoin(assessment, eq(assessment.id, assessmentResult.assessmentId))
        .innerJoin(student, and(
          eq(student.id, assessmentResult.studentId),
          eq(student.schoolId, teacherProfile.schoolId),
        ))
        .where(and(
          eq(assessment.createdBy, teacherProfile.id),
          eq(assessment.schoolId, teacherProfile.schoolId),
          inArray(student.class, classNames),
        ))
        .groupBy(student.class),
      db.select({
        classId: class_.id,
        total: sql<number>`count(${attendance.id})`,
        present: sql<number>`count(*) filter (where lower(${attendance.status}) = 'present')`,
      })
        .from(class_)
        .leftJoin(attendance, eq(attendance.classId, class_.id))
        .where(and(
          eq(class_.teacherId, teacherProfile.id),
          eq(class_.schoolId, teacherProfile.schoolId),
        ))
        .groupBy(class_.id),
      db.select({
        month: sql<string>`to_char(date_trunc('month', ${assessmentResult.createdAt}), 'YYYY-MM')`,
        submissions: sql<number>`count(${student.id})`,
        averageScore: sql<number | null>`avg(${assessmentResult.score})`,
      })
        .from(assessmentResult)
        .innerJoin(assessment, eq(assessment.id, assessmentResult.assessmentId))
        .innerJoin(student, and(
          eq(student.id, assessmentResult.studentId),
          eq(student.schoolId, teacherProfile.schoolId),
        ))
        .where(and(
          eq(assessment.createdBy, teacherProfile.id),
          eq(assessment.schoolId, teacherProfile.schoolId),
          inArray(student.class, classNames),
        ))
        .groupBy(sql`date_trunc('month', ${assessmentResult.createdAt})`)
        .orderBy(sql`date_trunc('month', ${assessmentResult.createdAt})`),
    ])
    : [[], [], [], []]

  const classPerformance = classes.map((item) => {
    const scores = classScores.find(row => row.className === item.name)
    const count = Number(scores?.submissions) || 0
    const total = Number(attendanceRows.find(row => row.classId === item.id)?.total) || 0
    const present = Number(attendanceRows.find(row => row.classId === item.id)?.present) || 0
    return {
      id: item.id,
      name: item.name,
      students: Number(studentCounts.find(row => row.className === item.name)?.totalStudents) || 0,
      submissions: count,
      averageScore: count ? Number(scores?.averageScore) || 0 : 0,
      passRate: count ? ((Number(scores?.passed) || 0) / count) * 100 : 0,
      attendanceRate: total ? (present / total) * 100 : 0,
    }
  })

  return {
    totalAssessments: rows.length,
    publishedAssessments: rows.filter(row => row.status === 'published' || row.status === 'approved').length,
    draftAssessments: rows.filter(row => row.status === 'draft' || row.status === 'pending_approval').length,
    averageScore: totalSubmissions ? totalWeightedScore / totalSubmissions : 0,
    subjects: subjectSummaries,
    classes: classPerformance,
    growth: growthRows.map(row => ({
      month: row.month,
      submissions: Number(row.submissions) || 0,
      averageScore: Number(row.averageScore) || 0,
    })),
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

  const performanceByClass: Record<string, { average: number; pass: number; fail: number }> = {}

  for (const [className, studentIds] of Object.entries(classGroups)) {
    const classResults = results.filter(r => studentIds.includes(r.studentId))
    const totalResults = classResults.length

    if (totalResults > 0) {
      const avgScore = classResults.reduce((sum, result) => sum + Number(result.score), 0) / totalResults
      const pass = classResults.filter(result => Number(result.score) >= 50).length
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
