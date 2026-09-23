import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { parseCSV } from '@/lib/csv-parser'
import { randomUUID } from 'crypto'
import { sql } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  // Check auth session
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const mode = formData.get('mode') as string || 'preview'
    const updateExisting = formData.get('updateExisting') === 'true'
    const skipDuplicates = formData.get('skipDuplicates') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const fileContent = await file.text()
    const records = parseCSV(fileContent)

    // Create import log record
    const importLogId = randomUUID()

    // Process each record
    const results = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: [] as { line: number; error: string }[]
    }

    const previewBooks: any[] = []

    // Execute queries using raw connection on db to be highly fast and direct
    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      const lineNumber = i + 2

      try {
        const isbn = record.isbn ? record.isbn.trim() : null
        const title = (record.title || record.Title || '').trim()
        const subtitle = (record.subtitle || record.Subtitle || '').trim() || null
        const authorsRaw = record.authors || record.Authors || record.author || record.Author || ''
        const authors = authorsRaw ? authorsRaw.split(',').map((a: string) => a.trim()) : []
        const publisher = (record.publisher || record.Publisher || '').trim() || null
        const pubYearRaw = record.publication_year || record.publicationYear || record.year || record.Year
        const publication_year = pubYearRaw ? parseInt(pubYearRaw) : null
        const edition = (record.edition || record.Edition || '').trim() || null
        const volume = (record.volume || record.Volume || '').trim() || null
        const language = (record.language || record.Language || 'English').trim()
        const pagesRaw = record.pages || record.Pages
        const pages = pagesRaw ? parseInt(pagesRaw) : null
        const category = (record.category || record.Category || record.genre || record.Genre || '').trim() || null
        const sub_category = (record.sub_category || record.subCategory || record.SubCategory || '').trim() || null
        const description = (record.description || record.Description || record.content || '').trim() || null
        const totalCopiesRaw = record.total_copies || record.totalCopies || record.total_copies
        const total_copies = totalCopiesRaw ? parseInt(totalCopiesRaw) : 1
        const physical_location = (record.physical_location || record.location || record.Location || '').trim() || null
        const class_level = (record.class_level || record.classLevel || record.class || '').trim() || null
        const keywordsRaw = record.keywords || record.Keywords || ''
        const keywords = keywordsRaw ? keywordsRaw.split(',').map((k: string) => k.trim()) : []
        const is_digital = String(record.is_digital || record.isDigital || '').toLowerCase() === 'true'

        if (!title) {
          throw new Error('Title is required')
        }

        // Check for duplicate by ISBN
        let existingId: string | null = null
        if (isbn) {
          const res = await db.execute(sql`SELECT id FROM library_books WHERE isbn = ${isbn} LIMIT 1;`)
          const rows = Array.isArray(res) ? res : []
          if (rows.length > 0) {
            existingId = (rows[0] as { id?: string | null }).id || null
          }
        }

        if (existingId) {
          if (skipDuplicates) {
            results.skipped++
            continue
          } else if (updateExisting) {
            // Update existing book
            if (mode === 'import') {
              await db.execute(sql`
                UPDATE library_books SET
                  title = ${title},
                  subtitle = ${subtitle},
                  authors = ${authors},
                  publisher = ${publisher},
                  publication_year = ${publication_year},
                  edition = ${edition},
                  volume = ${volume},
                  language = ${language},
                  pages = ${pages},
                  category = ${category},
                  sub_category = ${sub_category},
                  description = ${description},
                  total_copies = ${total_copies},
                  available_copies = ${total_copies},
                  location = ${physical_location},
                  class_level = ${class_level},
                  keywords = ${keywords},
                  is_digital = ${is_digital}
                WHERE id = ${existingId};
              `)
            }
            results.updated++
            continue
          }
        }

        // Create new book entry
        if (mode === 'import') {
          await db.execute(sql`
            INSERT INTO library_books (
              id, isbn, title, subtitle, authors, publisher, publication_year, edition, volume, language, pages, category, sub_category, description, total_copies, available_copies, location, class_level, keywords, is_digital
            ) VALUES (
              ${randomUUID()}, ${isbn}, ${title}, ${subtitle}, ${authors}, ${publisher}, ${publication_year}, ${edition}, ${volume}, ${language}, ${pages}, ${category}, ${sub_category}, ${description}, ${total_copies}, ${total_copies}, ${physical_location}, ${class_level}, ${keywords}, ${is_digital}
            );
          `)
        }

        if (previewBooks.length < 10) {
          previewBooks.push({
            isbn, title, authors, publisher, category, total_copies, class_level
          })
        }
        results.inserted++

      } catch (err: any) {
        results.failed++
        results.errors.push({
          line: lineNumber,
          error: err.message || 'Validation error'
        })
      }
    }

    // Write final log to database if in import mode
    if (mode === 'import') {
      await db.execute(sql`
        INSERT INTO book_import_logs (
          id, filename, total_records, inserted, updated, skipped, failed, errors, status, completed_at
        ) VALUES (
          ${importLogId}, ${file.name}, ${records.length}, ${results.inserted}, ${results.updated}, ${results.skipped}, ${results.failed}, ${JSON.stringify(results.errors)}, 'COMPLETED', now()
        );
      `)
    }

    return NextResponse.json({
      success: true,
      mode,
      summary: {
        total: records.length,
        inserted: results.inserted,
        updated: results.updated,
        skipped: results.skipped,
        failed: results.failed,
        insertable: records.length - results.skipped - results.failed,
        preview: previewBooks
      },
      errors: results.errors
    })

  } catch (error: any) {
    console.error('Import process failed:', error)
    return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 })
  }
}

// GET import history
export async function GET(request: NextRequest) {
  const session = await auth.getSession()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const list = await db.execute(sql`
      SELECT id, filename, total_records as "totalRecords", inserted, updated, skipped, failed, status, created_at as "createdAt"
      FROM book_import_logs
      ORDER BY created_at DESC
      LIMIT 20;
    `)
    return NextResponse.json({ success: true, data: list })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
