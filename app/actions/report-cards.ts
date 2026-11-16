'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  reportCardTable,
  student,
  parent,
  teacher,
  teacherOnSubject,
  class_,
  subject,
  school,
} from '@/lib/db/schema'
import { and, eq, inArray, isNotNull } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import sharp from 'sharp'
import { revalidatePath } from 'next/cache'
import { normalizeReportCardMarks, type ReportCardMark } from '@/lib/report-cards/marks'
import { printableReportCardPdfText, wrapReportCardPdfText } from '@/lib/report-cards/pdf-layout'

export type { ReportCardMark, ReportCardScore } from '@/lib/report-cards/marks'

export type ReportCard = {
  id: string
  schoolId: string
  studentId: string
  studentName: string
  className: string
  marks: ReportCardMark[]
  teacherRemarks: string
  status: 'PENDING' | 'ENDORSED' | 'REJECTED'
  adminFeedback?: string | null
  term?: string | null
  session?: string | null
  endorsedAt?: string | null
  createdAt: string
  schoolName?: string
  schoolLogoUrl?: string | null
}

function getReportCard(row: typeof reportCardTable.$inferSelect, schoolName?: string, schoolLogoUrl?: string | null): ReportCard {
  return {
    id: row.id,
    schoolId: row.schoolId || '',
    studentId: row.studentId,
    studentName: row.studentName,
    className: row.className,
    marks: row.marks as ReportCardMark[],
    teacherRemarks: row.teacherRemarks || '',
    status: (row.status || 'PENDING') as ReportCard['status'],
    adminFeedback: row.adminFeedback || null,
    term: row.term || 'First Term',
    session: row.session || '2026/2027',
    endorsedAt: row.endorsedAt?.toISOString() || null,
    createdAt: row.createdAt?.toISOString() || new Date().toISOString(),
    schoolName,
    schoolLogoUrl,
  }
}

async function getVisibleStudentIds(user: NonNullable<Awaited<ReturnType<typeof auth.getSession>>>['user']) {
  const role = user.role.toUpperCase()
  if (role === 'SUPER_ADMIN' && !user.schoolId) return null
  if (role === 'SUPER_ADMIN' && user.schoolId) {
    const students = await db.select({
      id: student.id,
      admissionNumber: student.admissionNumber,
    }).from(student).where(eq(student.schoolId, user.schoolId))
    return students.flatMap((record) => [record.id, ...(record.admissionNumber ? [record.admissionNumber] : [])])
  }

  if (role === 'STUDENT' || role === 'PUPIL') {
    const profile = await db.query.student.findFirst({ where: eq(student.userId, user.id) })
    if (!profile?.schoolId || (user.schoolId && profile.schoolId !== user.schoolId)) return []
    return [profile.id, ...(profile.admissionNumber ? [profile.admissionNumber] : [])]
  }

  if (role === 'PARENT') {
    const profile = await db.query.parent.findFirst({ where: eq(parent.userId, user.id) })
    if (!profile) return []
    const children = await db.select({
      id: student.id,
      admissionNumber: student.admissionNumber,
    }).from(student).where(eq(student.parentId, profile.id))
    return children.flatMap((child) => [child.id, ...(child.admissionNumber ? [child.admissionNumber] : [])])
  }

  if (role === 'TEACHER') {
    const profile = await db.query.teacher.findFirst({ where: eq(teacher.userId, user.id) })
    if (!profile?.schoolId || (user.schoolId && profile.schoolId !== user.schoolId)) return []
    const assignments = await db.select({ className: class_.name })
      .from(teacherOnSubject)
      .innerJoin(class_, eq(class_.id, teacherOnSubject.classId))
      .where(and(
        eq(teacherOnSubject.teacherId, profile.id),
        eq(class_.schoolId, profile.schoolId),
      ))
    const classNames = [...new Set(assignments.map((assignment) => assignment.className))]
    if (!classNames.length) return []
    const students = await db.select({
      id: student.id,
      admissionNumber: student.admissionNumber,
    }).from(student).where(and(
      eq(student.schoolId, profile.schoolId),
      inArray(student.class, classNames),
    ))
    return students.flatMap((record) => [record.id, ...(record.admissionNumber ? [record.admissionNumber] : [])])
  }

  if (role === 'ADMIN' || role === 'SCHOOL_ADMIN') {
    if (!user.schoolId) return []
    const students = await db.select({
      id: student.id,
      admissionNumber: student.admissionNumber,
    }).from(student).where(eq(student.schoolId, user.schoolId))
    return students.flatMap((record) => [record.id, ...(record.admissionNumber ? [record.admissionNumber] : [])])
  }

  return []
}

export async function getTeacherReportCardTargets() {
  const session = await auth.getSession()
  if (!session?.user || session.user.role.toUpperCase() !== 'TEACHER') throw new Error('Unauthorized')
  const profile = await db.query.teacher.findFirst({ where: eq(teacher.userId, session.user.id) })
  if (!profile?.schoolId || (session.user.schoolId && profile.schoolId !== session.user.schoolId)) {
    throw new Error('Teacher profile is not linked to your active school.')
  }

  return db.select({
    classId: class_.id,
    className: class_.name,
    subjectId: subject.id,
    subjectName: subject.name,
  }).from(teacherOnSubject)
    .innerJoin(class_, eq(class_.id, teacherOnSubject.classId))
    .innerJoin(subject, eq(subject.id, teacherOnSubject.subjectId))
    .where(and(
      eq(teacherOnSubject.teacherId, profile.id),
      eq(class_.schoolId, profile.schoolId),
    ))
}

export async function getReportCardStudents(classId: string) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role.toUpperCase() !== 'TEACHER') throw new Error('Unauthorized')
  const profile = await db.query.teacher.findFirst({ where: eq(teacher.userId, session.user.id) })
  if (!profile?.schoolId || (session.user.schoolId && profile.schoolId !== session.user.schoolId)) {
    throw new Error('Teacher profile is not linked to your active school.')
  }
  const assignedClass = await db.select({ name: class_.name })
    .from(teacherOnSubject)
    .innerJoin(class_, eq(class_.id, teacherOnSubject.classId))
    .where(and(
      eq(teacherOnSubject.teacherId, profile.id),
      eq(teacherOnSubject.classId, classId),
      eq(class_.schoolId, profile.schoolId),
    ))
    .limit(1)
  if (!assignedClass[0]) throw new Error('You can only select a class assigned to you.')

  return db.select({
    id: student.id,
    name: student.firstName,
    middleName: student.middleName,
    lastName: student.lastName,
  }).from(student).where(and(
    eq(student.schoolId, profile.schoolId),
    eq(student.class, assignedClass[0].name),
  ))
}

export async function getReportCards(): Promise<ReportCard[]> {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')

  const allowedStudentIds = await getVisibleStudentIds(session.user)
  const role = session.user.role.toUpperCase()
  const conditions = [isNotNull(reportCardTable.schoolId)]
  if (allowedStudentIds !== null) {
    if (!allowedStudentIds.length) return []
    conditions.push(inArray(reportCardTable.studentId, allowedStudentIds))
  }
  if (!['SUPER_ADMIN', 'STUDENT', 'PUPIL', 'PARENT'].includes(role)) {
    const userSchoolId = session.user.schoolId
    if (!userSchoolId) return []
    conditions.push(eq(reportCardTable.schoolId, userSchoolId))
  }
  if (role === 'STUDENT' || role === 'PUPIL' || role === 'PARENT') {
    conditions.push(eq(reportCardTable.status, 'ENDORSED'))
  }

  const rows = await db.select({
    card: reportCardTable,
    schoolName: school.name,
    schoolLogoUrl: school.logoUrl,
  }).from(reportCardTable)
    .leftJoin(school, eq(reportCardTable.schoolId, school.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(reportCardTable.createdAt)

  return rows.map(({ card, schoolName, schoolLogoUrl }) => getReportCard(card, schoolName || undefined, schoolLogoUrl))
}

export async function saveReportCard(data: {
  studentId: string
  marks: unknown
  teacherRemarks: string
}): Promise<ReportCard> {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')
  const role = session.user.role.toUpperCase()
  if (!['TEACHER', 'ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(role)) {
    throw new Error('Forbidden: Insufficient permissions to save report cards.')
  }
  if (typeof data.studentId !== 'string' || !data.studentId || data.studentId.length > 100) {
    throw new Error('Choose a valid student.')
  }
  const marks = normalizeReportCardMarks(data.marks)
  const teacherRemarks = typeof data.teacherRemarks === 'string' ? data.teacherRemarks.trim() : ''
  if (!teacherRemarks || teacherRemarks.length > 2000) throw new Error('Teacher remarks must contain 1 to 2,000 characters.')

  const profile = await db.query.student.findFirst({ where: eq(student.id, data.studentId) })
  if (!profile?.schoolId) throw new Error('Student was not found in an active school.')
  if (role !== 'SUPER_ADMIN' && (!session.user.schoolId || profile.schoolId !== session.user.schoolId)) {
    throw new Error('Forbidden: You can only create report cards for students in your school.')
  }
  if (role === 'TEACHER') {
    const teacherProfile = await db.query.teacher.findFirst({ where: eq(teacher.userId, session.user.id) })
    if (!teacherProfile || teacherProfile.schoolId !== profile.schoolId) {
      throw new Error('Teacher profile is not linked to the student’s school.')
    }
    const targets = await getTeacherReportCardTargets()
    const classTargets = targets.filter((target) => target.className.replace(/\s+/g, '').toUpperCase() === profile.class.replace(/\s+/g, '').toUpperCase())
    if (!classTargets.length) throw new Error('You are not assigned to the selected student’s class.')
    const assignedSubjects = new Set(classTargets.map((target) => target.subjectName.toLocaleLowerCase()))
    if (marks.some((mark) => !assignedSubjects.has(mark.subject.toLocaleLowerCase()))) {
      throw new Error('You can only enter scores for subjects assigned to you in this class.')
    }
  }

  const inserted = await db.insert(reportCardTable).values({
    id: randomUUID(),
    schoolId: profile.schoolId,
    studentId: profile.id,
    studentName: `${profile.firstName} ${profile.lastName}`,
    className: profile.class,
    marks,
    teacherRemarks,
    status: 'PENDING',
  }).returning()
  revalidatePath('/dashboard')
  return getReportCard(inserted[0])
}

async function getAdminReportCard(id: string): Promise<{
  row: typeof reportCardTable.$inferSelect & { schoolId: string }
  user: NonNullable<Awaited<ReturnType<typeof auth.getSession>>>['user']
}> {
  const session = await auth.getSession()
  if (!session?.user) throw new Error('Unauthorized')
  if (!['ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(session.user.role.toUpperCase())) {
    throw new Error('Forbidden: School administrator permissions are required.')
  }
  const row = await db.query.reportCardTable.findFirst({ where: eq(reportCardTable.id, id) })
  if (!row) throw new Error('Report card not found.')
  if (session.user.role.toUpperCase() !== 'SUPER_ADMIN' &&
    (!session.user.schoolId || row.schoolId !== session.user.schoolId)) {
    throw new Error('Report card not found in the active school.')
  }
  if (!row.schoolId) throw new Error('Report card has no verified school assignment.')
  return { row: { ...row, schoolId: row.schoolId }, user: session.user }
}

export async function updateReportCardScores(id: string, value: unknown): Promise<ReportCard> {
  const { row } = await getAdminReportCard(id)
  const marks = normalizeReportCardMarks(value)
  const updated = await db.update(reportCardTable)
    .set({
      marks,
      status: 'PENDING',
      adminFeedback: null,
      endorsedAt: null,
    })
    .where(and(eq(reportCardTable.id, row.id), eq(reportCardTable.schoolId, row.schoolId)))
    .returning()
  if (!updated[0]) throw new Error('Report card could not be updated.')
  revalidatePath('/dashboard')
  return getReportCard(updated[0])
}

export async function endorseReportCard(id: string, feedback?: string): Promise<ReportCard> {
  const { row } = await getAdminReportCard(id)
  const adminFeedback = (feedback?.trim() || 'Endorsed and approved by school administration.').slice(0, 2000)
  const updated = await db.update(reportCardTable)
    .set({ status: 'ENDORSED', adminFeedback, endorsedAt: new Date() })
    .where(and(
      eq(reportCardTable.id, row.id),
      eq(reportCardTable.schoolId, row.schoolId),
      eq(reportCardTable.status, 'PENDING'),
    ))
    .returning()
  if (!updated[0]) throw new Error('Only a pending report card can be endorsed.')
  revalidatePath('/dashboard')
  return getReportCard(updated[0])
}

export async function rejectReportCard(id: string, feedback: string): Promise<ReportCard> {
  const { row } = await getAdminReportCard(id)
  const adminFeedback = feedback.trim()
  if (!adminFeedback || adminFeedback.length > 2000) throw new Error('Enter rejection feedback of up to 2,000 characters.')
  const updated = await db.update(reportCardTable)
    .set({ status: 'REJECTED', adminFeedback, endorsedAt: null })
    .where(and(
      eq(reportCardTable.id, row.id),
      eq(reportCardTable.schoolId, row.schoolId),
      eq(reportCardTable.status, 'PENDING'),
    ))
    .returning()
  if (!updated[0]) throw new Error('Only a pending report card can be rejected.')
  revalidatePath('/dashboard')
  return getReportCard(updated[0])
}

async function loadSchoolLogo(urlValue: string | null | undefined) {
  if (!urlValue || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Upload a school logo before generating the official report card.')
  }
  const logoUrl = new URL(urlValue)
  const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  if (logoUrl.protocol !== 'https:' || logoUrl.origin !== supabaseUrl.origin ||
    !logoUrl.pathname.startsWith('/storage/v1/object/public/school-logos/')) {
    throw new Error('The school logo must be stored in the school-logos Supabase bucket.')
  }
  const response = await fetch(logoUrl, { signal: AbortSignal.timeout(5000), cache: 'no-store' })
  if (!response.ok) throw new Error('The uploaded school logo could not be loaded.')
  const bytes = new Uint8Array(await response.arrayBuffer())
  if (bytes.length > 2 * 1024 * 1024) throw new Error('The school logo is too large to embed in the report card.')
  return sharp(bytes, { limitInputPixels: 16_000_000 }).png().toBuffer()
}

export async function getOfficialReportCardPdf(id: string) {
  const cards = await getReportCards()
  const card = cards.find((item) => item.id === id)
  if (!card || card.status !== 'ENDORSED' || !card.schoolId) {
    throw new Error('An endorsed report card in your school account is required.')
  }
  const schoolRecord = await db.query.school.findFirst({ where: eq(school.id, card.schoolId) })
  if (!schoolRecord) throw new Error('The report card’s school record could not be found.')
  const logoBytes = await loadSchoolLogo(schoolRecord.logoUrl)

  const document = await PDFDocument.create()
  const regular = await document.embedFont(StandardFonts.Helvetica)
  const bold = await document.embedFont(StandardFonts.HelveticaBold)
  const logo = await document.embedPng(logoBytes)
  const pageSize = { width: 595, height: 842 }
  let page = document.addPage([pageSize.width, pageSize.height])
  let y = pageSize.height - 44

  const drawHeader = () => {
    page.drawRectangle({ x: 0, y: pageSize.height - 126, width: pageSize.width, height: 126, color: rgb(0.06, 0.12, 0.22) })
    page.drawImage(logo, { x: 36, y: pageSize.height - 101, width: 62, height: 62 })
    page.drawText(printableReportCardPdfText(schoolRecord.name), {
      x: 116, y: pageSize.height - 64, size: 19, font: bold, color: rgb(1, 1, 1), maxWidth: 430,
    })
    page.drawText('OFFICIAL SCHOOL REPORT CARD', {
      x: 116, y: pageSize.height - 88, size: 10, font: bold, color: rgb(0.79, 0.86, 0.94),
    })
    page.drawLine({
      start: { x: 36, y: pageSize.height - 126 },
      end: { x: pageSize.width - 36, y: pageSize.height - 126 },
      thickness: 3,
      color: rgb(0.16, 0.57, 0.84),
    })
  }

  const drawStudentDetails = () => {
    for (const line of wrapReportCardPdfText(card.studentName, bold, 16, pageSize.width - 72)) {
      page.drawText(line, { x: 36, y, size: 16, font: bold, color: rgb(0.1, 0.15, 0.22) })
      y -= 20
    }
    const details = `Class: ${card.className}    Term: ${card.term || 'First Term'}    Session: ${card.session || '2026/2027'}`
    for (const line of wrapReportCardPdfText(details, regular, 9, pageSize.width - 72)) {
      page.drawText(line, { x: 36, y, size: 9, font: regular, color: rgb(0.29, 0.35, 0.42) })
      y -= 13
    }
    y -= 10
  }

  const columns = { subject: 36, scores: 170, total: 458, grade: 522 }
  const drawTableHeader = () => {
    page.drawRectangle({ x: 36, y: y - 10, width: pageSize.width - 72, height: 26, color: rgb(0.91, 0.95, 0.98) })
    page.drawText('SUBJECT', { x: columns.subject, y, size: 8, font: bold, color: rgb(0.2, 0.27, 0.34) })
    page.drawText('SCORE BREAKDOWN', { x: columns.scores, y, size: 8, font: bold, color: rgb(0.2, 0.27, 0.34) })
    page.drawText('TOTAL', { x: columns.total, y, size: 8, font: bold, color: rgb(0.2, 0.27, 0.34) })
    page.drawText('GRADE', { x: columns.grade, y, size: 8, font: bold, color: rgb(0.2, 0.27, 0.34) })
    y -= 30
  }

  const startPage = (includeTableHeader: boolean) => {
    page = document.addPage([pageSize.width, pageSize.height])
    drawHeader()
    y = pageSize.height - 158
    drawStudentDetails()
    if (includeTableHeader) drawTableHeader()
  }

  drawHeader()
  y = pageSize.height - 158
  drawStudentDetails()
  drawTableHeader()

  for (const mark of card.marks) {
    const breakdown = [
      `Test ${mark.testScore}/30`,
      `Exam ${mark.examScore}/70`,
      ...(mark.otherScores || []).map((score) => `${printableReportCardPdfText(score.label)} ${score.score}/${score.maxScore}`),
    ].join(' | ')
    const subjectLines = wrapReportCardPdfText(mark.subject, regular, 8, 128)
    const breakdownLines = wrapReportCardPdfText(breakdown, regular, 7, 278)
    const rowHeight = Math.max(subjectLines.length, breakdownLines.length) * 10 + 8
    if (y - rowHeight < 55) startPage(true)

    for (let index = 0; index < Math.max(subjectLines.length, breakdownLines.length); index += 1) {
      const lineY = y - index * 10
      if (subjectLines[index]) {
        page.drawText(subjectLines[index], { x: columns.subject, y: lineY, size: 8, font: regular, color: rgb(0.1, 0.15, 0.22) })
      }
      if (breakdownLines[index]) {
        page.drawText(breakdownLines[index], { x: columns.scores, y: lineY, size: 7, font: regular, color: rgb(0.29, 0.35, 0.42) })
      }
    }
    page.drawText(String(mark.total), { x: columns.total, y, size: 9, font: bold, color: rgb(0.1, 0.15, 0.22) })
    page.drawText(mark.grade, { x: columns.grade, y, size: 9, font: bold, color: rgb(0.1, 0.15, 0.22) })
    y -= rowHeight
    page.drawLine({ start: { x: 36, y: y + 4 }, end: { x: pageSize.width - 36, y: y + 4 }, thickness: 0.5, color: rgb(0.87, 0.9, 0.93) })
  }

  const drawSection = (title: string, text: string) => {
    const lines = wrapReportCardPdfText(text, regular, 9, pageSize.width - 72)
    if (y - 29 < 55) startPage(false)
    page.drawText(title, { x: 36, y, size: 9, font: bold, color: rgb(0.2, 0.27, 0.34) })
    y -= 16
    for (const line of lines) {
      if (y < 55) startPage(false)
      page.drawText(line, { x: 36, y, size: 9, font: regular, color: rgb(0.2, 0.27, 0.34) })
      y -= 13
    }
    y -= 18
  }

  drawSection('TEACHER REMARKS', card.teacherRemarks || 'No remarks provided.')
  drawSection('SCHOOL ADMINISTRATION', card.adminFeedback || 'Endorsed and approved by school administration.')

  const pdfBytes = await document.save()
  const safeName = card.studentName.trim().replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 60) || 'student'
  return {
    fileName: `Report_Card_${safeName}_${card.session || 'session'}_${card.term || 'term'}.pdf`,
    base64: Buffer.from(pdfBytes).toString('base64'),
  }
}
