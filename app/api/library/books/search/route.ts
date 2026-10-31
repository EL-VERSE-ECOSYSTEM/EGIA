import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { sanitizeServerError } from '@/lib/errors'

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

    const conditions = [sql`deleted_at IS NULL`]

    // Enforce tenant isolation: non-SUPER_ADMIN users only access their own school's books or global books
    const userRole = session.user.role?.toUpperCase()
    const schoolId = session.user.schoolId
    if (userRole !== 'SUPER_ADMIN') {
      if (schoolId) {
        conditions.push(sql`(school_id = ${schoolId} OR school_id IS NULL)`)
      } else {
        conditions.push(sql`school_id IS NULL`)
      }
    }

    if (sanitizedQuery) {
      const pattern = `%${sanitizedQuery}%`
      conditions.push(sql`(title ILIKE ${pattern} OR array_to_string(authors, ' ') ILIKE ${pattern} OR description ILIKE ${pattern})`)
    }

    if (category) {
      conditions.push(sql`category = ${category}`)
    }

    if (classLevel) {
      conditions.push(sql`class_level = ${classLevel}`)
    }

    if (availability === 'available') {
      conditions.push(sql`available_copies > 0`)
    }

    const whereSql = sql.join(conditions, sql` AND `)

    let orderSql = sql`ORDER BY title ASC`
    if (sortBy === 'rating') {
      orderSql = sql`ORDER BY rating DESC`
    } else if (sortBy === 'popular') {
      orderSql = sql`ORDER BY borrowed_count DESC`
    } else if (sortBy === 'newest') {
      orderSql = sql`ORDER BY created_at DESC`
    }

    const booksQuery = sql`
      SELECT id, isbn, title, subtitle, authors, publisher, publication_year as "publicationYear",
             edition, volume, language, pages, category, sub_category as "subCategory", description,
             cover_image_url as "coverImageUrl", location as "physicalLocation",
             total_copies as "totalCopies", available_copies as "availableCopies", borrowed_count as "borrowedCount",
             rating, rating_count as "ratingCount", is_digital as "isDigital", class_level as "classLevel"
      FROM library_books
      WHERE ${whereSql}
      ${orderSql}
      LIMIT ${limit} OFFSET ${offset};
    `

    const countQuery = sql`
      SELECT count(*)::integer as total FROM library_books WHERE ${whereSql};
    `

    const books = await db.execute(booksQuery)
    const counts = await db.execute(countQuery)
    const total = Number((counts as any)?.[0]?.total || 0)

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
    const safeErr = sanitizeServerError('GET /api/library/books/search', error, 'Library search failed')
    return NextResponse.json({ error: safeErr.error, requestId: safeErr.requestId }, { status: 500 })
  }
}
