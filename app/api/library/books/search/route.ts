import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const session = await auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rawQuery = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const classLevel = searchParams.get('classLevel') || ''
    const availability = searchParams.get('availability') || 'all'
    const sortBy = searchParams.get('sortBy') || 'relevance'

    const rawPage = searchParams.get('page') || '1'
    const rawLimit = searchParams.get('limit') || '20'

    // Parse and clamp limit and page safely to prevent SQL injection & DoS
    const page = Math.max(1, Math.min(10000, Number.parseInt(rawPage, 10) || 1))
    const limit = Math.max(1, Math.min(100, Number.parseInt(rawLimit, 10) || 20))
    const offset = (page - 1) * limit

    const sanitizedQuery = rawQuery.trim().slice(0, 200)

    let whereClause = "WHERE deleted_at IS NULL"
    const params: any[] = []
    let paramIndex = 1

    if (sanitizedQuery) {
      whereClause += ` AND (title ILIKE $${paramIndex} OR array_to_string(authors, ' ') ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`
      params.push(`%${sanitizedQuery}%`)
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

    let orderClause = "ORDER BY title ASC"
    if (sortBy === 'rating') {
      orderClause = "ORDER BY rating DESC"
    } else if (sortBy === 'popular') {
      orderClause = "ORDER BY borrowed_count DESC"
    } else if (sortBy === 'newest') {
      orderClause = "ORDER BY created_at DESC"
    }

    const booksQuery = `
      SELECT id, isbn, title, subtitle, authors, publisher, publication_year as "publicationYear",
             edition, volume, language, pages, category, sub_category as "subCategory", description,
             cover_image_url as "coverImageUrl", location as "physicalLocation",
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

    if (sanitizedQuery) {
      try {
        await db.execute(sql`
          INSERT INTO search_logs (id, query, results_count)
          VALUES (${randomUUID()}, ${sanitizedQuery}, ${total});
        `)
      } catch (err) {
        // Fallback if search_logs table is missing
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
    console.error('Library search failed:', error)
    return NextResponse.json({ error: 'Library search failed' }, { status: 500 })
  }
}
