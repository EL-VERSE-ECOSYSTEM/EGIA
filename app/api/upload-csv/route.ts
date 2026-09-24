import { NextRequest, NextResponse } from 'next/server'
import { parseCSVAdvanced, mapCSVFields } from '@/lib/csv-parser'
import { db } from '@/lib/db'
import { libraryBooks, assessmentQuestion, assessment, user as userTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_ROWS = 500

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 })
    }

    const role = (user.user_metadata?.role || '').toUpperCase()
    if (!['ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions to upload CSV.' }, { status: 403 })
    }

    const contentType = req.headers.get('content-type') || ''

    let csvContent = ''
    let type = 'general'
    let mapping: Record<string, string> = {}
    let targetId = ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null
      type = (formData.get('type') as string) || 'general'
      targetId = (formData.get('targetId') as string) || ''
      const mappingRaw = formData.get('mapping') as string | null

      if (mappingRaw) {
        try {
          mapping = JSON.parse(mappingRaw)
        } catch {
          mapping = {}
        }
      }

      if (!file) {
        return NextResponse.json({ error: 'No CSV file provided' }, { status: 400 })
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File size exceeds maximum allowed limit of 5MB.' }, { status: 400 })
      }

      csvContent = await file.text()
    } else {
      const json = await req.json()
      csvContent = json.csvContent || ''
      type = json.type || 'general'
      mapping = json.mapping || {}
      targetId = json.targetId || ''
    }

    if (!csvContent.trim()) {
      return NextResponse.json({ error: 'CSV file content is empty' }, { status: 400 })
    }

    const parsed = parseCSVAdvanced(csvContent)

    if (parsed.rows.length === 0) {
      return NextResponse.json({ error: 'No valid data rows found in CSV' }, { status: 400 })
    }

    if (parsed.rows.length > MAX_ROWS) {
      return NextResponse.json({ error: `CSV row count exceeds maximum limit of ${MAX_ROWS} rows.` }, { status: 400 })
    }

    let insertedRecordsCount = 0

    // Database insertion handling depending on CSV mode
    if (type === 'books' || type === 'lesson-notes') {
      const mappedBooks = mapCSVFields(parsed.rows, {
        title: mapping.title || 'Title',
        author: mapping.author || 'Author',
        subject: mapping.subject || 'Subject',
        classLevel: mapping.classLevel || mapping.class_level || 'Class',
        category: mapping.category || mapping.genre || 'Category',
        isbn: mapping.isbn || 'ISBN',
        publicationYear: mapping.year || mapping.publicationYear || 'Year',
        description: mapping.description || mapping.content || 'Content/Description',
        fileUrl: mapping.fileUrl || mapping.file_url || 'File_URL',
        pages: mapping.pages || 'Pages',
        content: mapping.content || mapping.description || 'Content/Description',
      })

      const bookInserts = mappedBooks.map(b => ({
        id: randomUUID(),
        title: b.title || 'Untitled Lesson Note',
        author: b.author || 'EL LEARNERS APP AUTHOR',
        subject: b.subject || 'General Studies',
        classLevel: b.classLevel || 'SSS 1',
        category: b.category || (type === 'lesson-notes' ? 'Lesson Notes' : 'General'),
        isbn: b.isbn || null,
        publicationYear: isNaN(Number(b.publicationYear)) ? 2026 : Number(b.publicationYear),
        description: b.description || b.content || 'Lesson note resource material.',
        content: b.content || b.description || 'Lesson note resource material.',
        fileUrl: b.fileUrl || null,
        pages: isNaN(Number(b.pages)) ? 1 : Number(b.pages),
        isDigital: true,
        totalCopies: 1,
        availableCopies: 1,
        createdAt: new Date(),
      }))

      if (bookInserts.length > 0) {
        await db.insert(libraryBooks).values(bookInserts as any).onConflictDoNothing()
        insertedRecordsCount = bookInserts.length
      }
    } else if (type === 'quiz' && targetId) {
      // Check target assessment existence and ownership/school match if available
      const existingAssessment = await db.query.assessment.findFirst({
        where: eq(assessment.id, targetId)
      })

      if (!existingAssessment) {
        return NextResponse.json({ error: 'Target assessment not found.' }, { status: 404 })
      }

      if (role !== 'SUPER_ADMIN') {
        let userSchoolId = user.user_metadata?.school_id || user.user_metadata?.schoolId || null
        if (!userSchoolId) {
          const userRecord = await db.query.user.findFirst({
            where: eq(userTable.id, user.id)
          })
          userSchoolId = userRecord?.schoolId || null
        }

        if (existingAssessment.schoolId && (!userSchoolId || existingAssessment.schoolId !== userSchoolId)) {
          return NextResponse.json({ error: 'Forbidden: Cannot modify assessment belonging to another school.' }, { status: 403 })
        }
      }

      const mappedQuestions = mapCSVFields(parsed.rows, {
        questionText: mapping.question || 'Question',
        optionA: mapping.optionA || 'Option A',
        optionB: mapping.optionB || 'Option B',
        optionC: mapping.optionC || 'Option C',
        optionD: mapping.optionD || 'Option D',
        correctAnswer: mapping.correct || 'Correct',
        imageUrl: mapping.imageUrl || mapping.image || 'Image_URL',
      })

      const questionInserts = mappedQuestions.map((q, idx) => ({
        id: randomUUID(),
        assessmentId: targetId,
        questionText: q.questionText || `Question ${idx + 1}`,
        questionType: 'MCQ_SINGLE',
        options: JSON.stringify([q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean)),
        correctAnswer: q.correctAnswer || q.optionA || '',
        imageUrl: q.imageUrl || null,
        points: 1,
        order: idx + 1,
      }))

      if (questionInserts.length > 0) {
        await db.insert(assessmentQuestion).values(questionInserts as any)
        insertedRecordsCount = questionInserts.length
      }
    }

    return NextResponse.json({
      success: true,
      headers: parsed.headers,
      totalRows: parsed.totalRows,
      detectedTypes: parsed.detectedTypes,
      insertedRecordsCount,
    })
  } catch (error) {
    console.error('Error in POST /upload-csv:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process CSV file' },
      { status: 500 }
    )
  }
}
