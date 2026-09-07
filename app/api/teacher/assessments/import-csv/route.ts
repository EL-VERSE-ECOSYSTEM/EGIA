import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { parseCSV, validateQuestionCSV } from '@/lib/csv-parser'
import { db } from '@/lib/db'
import { assessmentQuestion, assessment, teacher, term } from '@/lib/db/schema'
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

    if (!validateQuestionCSV(data)) {
      return NextResponse.json({ error: 'Invalid CSV format. Missing required columns: questionText, questionType, marks' }, { status: 400 })
    }

    // If no existing assessmentId provided, create a new CBT assessment record
    if (!assessmentId) {
      let targetSubjectId = subjectId
      if (!targetSubjectId) {
        const firstSub = await db.query.subject.findFirst()
        targetSubjectId = firstSub ? firstSub.id : uuidv4()
      }

      let currentTerm = await db.query.term.findFirst({ where: eq(term.isCurrent, true) })
      if (!currentTerm) {
        const allTerms = await db.query.term.findMany()
        currentTerm = allTerms[0]
      }

      const newId = uuidv4()
      await db.insert(assessment).values({
        id: newId,
        title,
        description: 'Bulk CSV Imported Assessment',
        subjectId: targetSubjectId,
        termId: currentTerm?.id || 'default-term',
        createdBy: teacherProfile.id,
        duration: duration || 60,
        type,
        status: 'pending_approval', // Pending Admin approval
        passingScore: 40,
        totalPoints: data.reduce((sum, row) => sum + (parseInt(row.marks, 10) || 1), 0),
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
      let parsedOptions = null
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
        id: uuidv4(),
        assessmentId,
        questionText: row.questionText || row.question || `Question ${index + 1}`,
        questionType: row.questionType || 'multiple_choice',
        points: marks,
        options: parsedOptions,
        correctAnswer: row.correctAnswer || row.answer || row.correct || '',
        imageUrl: row.imageUrl || row.image || row.image_url || null,
        explanation: row.explanation || null,
        order: index + 1,
      }
    })

    await db.insert(assessmentQuestion).values(questionsToInsert)

    return NextResponse.json({ success: true, count: questionsToInsert.length, assessmentId })
  } catch (error: any) {
    console.error('CSV import failed:', error)
    return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 })
  }
}
