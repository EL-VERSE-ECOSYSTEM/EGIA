import { NextRequest, NextResponse } from 'next/server'
import { parseCSVAdvanced, mapCSVFields } from '@/lib/csv-parser'
import { db } from '@/lib/db'
import { libraryBooks, assessment, assessmentQuestion } from '@/lib/db/schema'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
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
        isbn: b.isbn || `LN-${Math.floor(100000 + Math.random() * 900000)}`,
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
      rows: parsed.rows,
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
