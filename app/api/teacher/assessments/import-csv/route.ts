import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { parseCSV, validateQuestionCSV } from '@/lib/csv-parser'
import { db } from '@/lib/db'
import { assessmentQuestion } from '@/lib/db/schema'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const assessmentId = formData.get('assessmentId') as string

    if (!file || !assessmentId) {
      return NextResponse.json({ error: 'Missing file or assessmentId' }, { status: 400 })
    }

    const text = await file.text()
    const data = parseCSV(text)

    if (!validateQuestionCSV(data)) {
      return NextResponse.json({ error: 'Invalid CSV format' }, { status: 400 })
    }

    const questionsToInsert = data.map((row, index) => ({
      id: uuidv4(),
      assessmentId,
      questionText: row.questionText,
      questionType: row.questionType,
      marks: parseInt(row.marks) || 1,
      options: row.options ? JSON.parse(row.options) : null,
      correctAnswer: row.correctAnswer,
      explanation: row.explanation,
      sequenceNumber: index + 1,
    }))

    await db.insert(assessmentQuestion).values(questionsToInsert)

    return NextResponse.json({ success: true, count: questionsToInsert.length })
  } catch (error: any) {
    console.error('CSV import failed:', error)
    return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 })
  }
}
