import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'
import { eq, and, sql } from 'drizzle-orm'

// Custom robust parser for CSV files to avoid importing heavy third-party parsers
function parseCSV(content: string): any[] {
  const lines = content.split(/\r?\n/)
  if (lines.length === 0) return []

  // Parse headers
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const records = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Parse values respecting quoted commas
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''))
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''))

    if (values.length > 0) {
      const record: any = {}
      headers.forEach((header, index) => {
        record[header] = values[index] || ''
      })
      records.push(record)
    }
  }
  return records
}

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
        const title = record.title ? record.title.trim() : ''
        const subtitle = record.subtitle ? record.subtitle.trim() : null
        const authors = record.authors ? record.authors.split(',').map((a: string) => a.trim()) : []
        const publisher = record.publisher ? record.publisher.trim() : null
        const publication_year = record.publication_year ? parseInt(record.publication_year) : null
        const edition = record.edition ? record.edition.trim() : null
        const volume = record.volume ? record.volume.trim() : null
        const language = record.language ? record.language.trim() : 'English'
        const pages = record.pages ? parseInt(record.pages) : null
        const category = record.category ? record.category.trim() : null
        const sub_category = record.sub_category ? record.sub_category.trim() : null
        const description = record.description ? record.description.trim() : null
        const total_copies = record.total_copies ? parseInt(record.total_copies) : 1
        const physical_location = record.physical_location ? record.physical_location.trim() : null
        const class_level = record.class_level ? record.class_level.trim() : null
        const keywords = record.keywords ? record.keywords.split(',').map((k: string) => k.trim()) : []
        const is_digital = record.is_digital === 'true'

        if (!title) {
          throw new Error('Title is required')
        }

        // Check for duplicate by ISBN
        let existingId = null
        if (isbn) {
          const res = await db.execute(sql`SELECT id FROM books WHERE isbn = ${isbn} LIMIT 1;`)
          if (res.length > 0) {
            existingId = res[0].id
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
                UPDATE books SET
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
                  physical_location = ${physical_location},
                  class_level = ${class_level},
                  keywords = ${keywords},
                  is_digital = ${is_digital},
                  updated_at = now()
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
            INSERT INTO books (
              id, isbn, title, subtitle, authors, publisher, publication_year, edition, volume, language, pages, category, sub_category, description, total_copies, available_copies, physical_location, class_level, keywords, is_digital
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
