import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { parseCSV } from '@/lib/csv-parser'
import { db } from '@/lib/db'
import { assessmentQuestion, assessment, teacher, term, subject } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'TEACHER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    let assessmentId = formData.get('assessmentId') as string
    const title = formData.get('title') as string || 'CSV Imported Assessment'
    const type = formData.get('type') as string || 'ASSESSMENT_CBT'
    const subjectId = formData.get('subjectId') as string
    const duration = parseInt((formData.get('duration') as string) || '60', 10)

    if (!file) {
      return NextResponse.json({ error: 'No CSV file uploaded' }, { status: 400 })
    }

    const teacherProfile = await db.query.teacher.findFirst({ where: eq(teacher.userId, session.user.id) })
    if (!teacherProfile) return NextResponse.json({ error: 'Teacher profile not found' }, { status: 403 })

    const text = await file.text()
    const data = parseCSV(text) as any[]

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty or contains no valid records.' }, { status: 400 })
    }

    // Validate rows rigorously
    const invalidRows: string[] = []
    data.forEach((row, idx) => {
      const qText = row.questionText || row.question
      if (!qText || !qText.trim()) {
        invalidRows.push(`Row ${idx + 1}: Missing question text`)
      }
      const answer = row.correctAnswer || row.answer || row.correct
      if (!answer || !answer.trim()) {
        invalidRows.push(`Row ${idx + 1}: Missing correct answer`)
      }
    })

    if (invalidRows.length > 0) {
      return NextResponse.json({
        error: `CSV validation failed: ${invalidRows.slice(0, 5).join('; ')}${invalidRows.length > 5 ? ` and ${invalidRows.length - 5} more errors` : ''}`
      }, { status: 400 })
    }

    // If no existing assessmentId provided, require valid subject and term records
    if (!assessmentId) {
      if (!subjectId) {
        return NextResponse.json({ error: 'Explicit subjectId is required when creating a new assessment.' }, { status: 400 })
      }

      const existingSubject = await db.query.subject.findFirst({ where: eq(subject.id, subjectId) })
      if (!existingSubject) {
        return NextResponse.json({ error: 'Specified subject does not exist.' }, { status: 400 })
      }

      let currentTerm = await db.query.term.findFirst({ where: eq(term.isCurrent, true) })
      if (!currentTerm) {
        const allTerms = await db.query.term.findMany()
        currentTerm = allTerms[0]
      }

      if (!currentTerm) {
        return NextResponse.json({ error: 'No active academic term found. Please contact administrator.' }, { status: 400 })
      }

      const newId = randomUUID()
      await db.insert(assessment).values({
        id: newId,
        schoolId: teacherProfile.schoolId || null,
        title,
        description: 'Bulk CSV Imported Assessment',
        subjectId: existingSubject.id,
        termId: currentTerm.id,
        createdBy: teacherProfile.id,
        duration: duration || 60,
        type,
        status: 'pending_approval',
        passingScore: 40,
        totalPoints: data.reduce((sum, row) => sum + (parseInt(row.marks || row.points || '1', 10) || 1), 0),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      assessmentId = newId
    } else {
      // Ensure owned assessment exists and set status to pending_approval
      const owned = await db.query.assessment.findFirst({
        where: and(eq(assessment.id, assessmentId), eq(assessment.createdBy, teacherProfile.id))
      })
      if (!owned) return NextResponse.json({ error: 'Assessment not found or permission denied' }, { status: 404 })

      await db.update(assessment)
        .set({ status: 'pending_approval', updatedAt: new Date() })
        .where(eq(assessment.id, assessmentId))
    }

    const questionsToInsert = data.map((row: any, index: number) => {
      const marks = parseInt(row.marks || row.points || '1', 10) || 1
      let parsedOptions: any = null
      if (row.options) {
        try {
          parsedOptions = typeof row.options === 'string' && row.options.startsWith('[')
            ? JSON.parse(row.options)
            : row.options.split(';').map((s: string) => s.trim())
        } catch (e) {
          parsedOptions = [row.options]
        }
      } else if (row.optionA || row.optionB) {
        parsedOptions = [row.optionA, row.optionB, row.optionC, row.optionD].filter(Boolean)
      }

      return {
        id: randomUUID(),
        assessmentId,
        questionText: (row.questionText || row.question).trim(),
        questionType: row.questionType || 'multiple_choice',
        points: marks,
        options: parsedOptions ? JSON.stringify(parsedOptions) : null,
        correctAnswer: (row.correctAnswer || row.answer || row.correct).trim(),
        imageUrl: row.imageUrl || row.image || row.image_url || null,
        explanation: row.explanation || null,
        order: index + 1,
      }
    })

    await db.insert(assessmentQuestion).values(questionsToInsert as any)

    return NextResponse.json({ success: true, count: questionsToInsert.length, assessmentId })
  } catch (error: any) {
    console.error('CSV import failed:', error)
    return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 })
  }
}
