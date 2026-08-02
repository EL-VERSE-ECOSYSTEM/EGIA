import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const classLevel = searchParams.get('classLevel') || ''
  const availability = searchParams.get('availability') || 'all'
  const sortBy = searchParams.get('sortBy') || 'relevance'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  try {
    // 1. Build dynamic where clause for SQL execution
    let whereClause = "WHERE deleted_at IS NULL"
    const params: any[] = []
    let paramIndex = 1

    if (query) {
      whereClause += ` AND (title ILIKE $${paramIndex} OR array_to_string(authors, ' ') ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`
      params.push(`%${query}%`)
      paramIndex++
    }

    if (category) {
      whereClause += ` AND category = $${paramIndex}`
      params.push(category)
      paramIndex++
    }

    if (classLevel) {
      whereClause += ` AND class_level = $${paramIndex}`
      params.push(classLevel)
      paramIndex++
    }

    if (availability === 'available') {
      whereClause += " AND available_copies > 0"
    }

    // Sort order
    let orderClause = "ORDER BY title ASC"
    if (sortBy === 'rating') {
      orderClause = "ORDER BY rating DESC"
    } else if (sortBy === 'popular') {
      orderClause = "ORDER BY borrowed_count DESC"
    } else if (sortBy === 'newest') {
      orderClause = "ORDER BY created_at DESC"
    }

    // 2. Query books and count total
    const booksQuery = `
      SELECT id, isbn, title, subtitle, authors, publisher, publication_year as "publicationYear",
             edition, volume, language, pages, category, sub_category as "subCategory", description,
             cover_image_url as "coverImageUrl", file_url as "fileUrl", location as "physicalLocation",
             total_copies as "totalCopies", available_copies as "availableCopies", borrowed_count as "borrowedCount",
             rating, rating_count as "ratingCount", is_digital as "isDigital", class_level as "classLevel"
      FROM library_books
      ${whereClause}
      ${orderClause}
      LIMIT ${limit} OFFSET ${offset};
    `

    const countQuery = `
      SELECT count(*)::integer as total FROM library_books ${whereClause};
    `

    const books = await db.execute(sql.raw(booksQuery))
    const counts = await db.execute(sql.raw(countQuery))
    const total = Number(counts[0]?.total || 0)

    // 3. Log search query to database for analytics
    if (query) {
      try {
        await db.execute(sql`
          INSERT INTO search_logs (id, query, results_count)
          VALUES (${randomUUID()}, ${query}, ${total});
        `)
      } catch (err) {
        // Safe fallback if search_logs table is not present
      }
    }

    return NextResponse.json({
      success: true,
      data: books,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Search failed:', error)
    return NextResponse.json({ error: error.message || 'Search failed' }, { status: 500 })
  }
}
