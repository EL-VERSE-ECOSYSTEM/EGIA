import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''

  if (query.length < 2) {
    return NextResponse.json({ success: true, suggestions: [] })
  }

  try {
    // Search matching titles
    const titleRes = await db.execute(sql`
      SELECT title as text, 'title' as type FROM library_books
      WHERE title ILIKE ${`%${query}%`}
      LIMIT 5;
    `)

    // Search matching categories
    const categoryRes = await db.execute(sql`
      SELECT DISTINCT category as text, 'category' as type FROM library_books
      WHERE category ILIKE ${`%${query}%`}
      LIMIT 3;
    `)

    const suggestions = [...titleRes, ...categoryRes]

    return NextResponse.json({
      success: true,
      suggestions
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
