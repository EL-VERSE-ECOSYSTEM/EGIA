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
    if (type === 'books') {
      const mappedBooks = mapCSVFields(parsed.rows, {
        title: mapping.title || 'Title',
        author: mapping.author || 'Author',
        category: mapping.genre || mapping.category || 'Genre',
        isbn: mapping.isbn || 'ISBN',
        publicationYear: mapping.year || mapping.publicationYear || 'Year',
        description: mapping.description || mapping.content || 'Content/Description',
        coverImageUrl: mapping.coverUrl || mapping.coverImageUrl || 'Cover_URL',
        pages: mapping.pages || 'Pages',
        content: mapping.content || mapping.description || 'Content/Description',
      })

      const bookInserts = mappedBooks.map(b => ({
        id: randomUUID(),
        title: b.title || 'Untitled Book',
        author: b.author || 'Unknown Author',
        category: b.category || 'General',
        isbn: b.isbn || `ISBN-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        publicationYear: isNaN(Number(b.publicationYear)) ? 2026 : Number(b.publicationYear),
        description: b.description || 'Book catalog item.',
        content: b.content || b.description || '',
        coverImageUrl: b.coverImageUrl || '/placeholder-book.png',
        pages: isNaN(Number(b.pages)) ? 150 : Number(b.pages),
        totalCopies: 5,
        availableCopies: 5,
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
      })

      const questionInserts = mappedQuestions.map((q, idx) => ({
        id: randomUUID(),
        assessmentId: targetId,
        questionText: q.questionText || `Question ${idx + 1}`,
        questionType: 'MCQ_SINGLE',
        options: JSON.stringify([q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean)),
        correctAnswer: q.correctAnswer || q.optionA || '',
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
