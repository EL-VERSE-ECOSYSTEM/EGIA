import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { parseCSV, validateQuestionCSV } from '@/lib/csv-parser'
import { db } from '@/lib/db'
import { assessmentQuestion, assessment, teacher } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const assessmentId = formData.get('assessmentId') as string

    if (!file || !assessmentId) {
      return NextResponse.json({ error: 'Missing file or assessmentId' }, { status: 400 })
    }

    const teacherProfile = await db.query.teacher.findFirst({ where: eq(teacher.userId, session.user.id) })
    if (!teacherProfile) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 403 })
    const ownedAssessment = await db.query.assessment.findFirst({
      where: and(eq(assessment.id, assessmentId), eq(assessment.createdBy, teacherProfile.id)),
    })
    if (!ownedAssessment) return NextResponse.json({ error: 'Assessment not found or access denied' }, { status: 404 })

    const text = await file.text()
    const data = parseCSV(text) as any[]

    if (!validateQuestionCSV(data)) {
      return NextResponse.json({ error: 'Invalid CSV format' }, { status: 400 })
    }

    const questionsToInsert = data.map((row: any, index: number) => {

      const marks = parseInt(row.marks, 10)
      if (isNaN(marks) || marks <= 0) {
        throw new Error(`Invalid marks value at row ${index + 1}. Marks must be a positive integer.`)
      }

      return {
        id: uuidv4(),
        assessmentId,
        questionText: row.questionText,
        questionType: row.questionType,
        points: marks,
        options: row.options ? JSON.parse(row.options) : null,
        correctAnswer: row.correctAnswer,
        explanation: row.explanation,
        order: index + 1,
      }
    })

    await db.insert(assessmentQuestion).values(questionsToInsert)

    return NextResponse.json({ success: true, count: questionsToInsert.length })
  } catch (error: any) {
    console.error('CSV import failed:', error)
    return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 })
  }
}
