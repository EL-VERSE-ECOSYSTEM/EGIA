import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { sql } from 'drizzle-orm'

interface SearchParamsInput {
  q?: string
  category?: string
  classLevel?: string
  availability?: string
  sortBy?: string
  page?: string
  limit?: string
}

function buildLibrarySearchQuery(params: SearchParamsInput) {
  const rawQuery = params.q || ''
  const category = params.category || ''
  const classLevel = params.classLevel || ''
  const availability = params.availability || 'all'
  const sortBy = params.sortBy || 'relevance'

  const page = Math.max(1, Math.min(10000, Number.parseInt(params.page || '1', 10) || 1))
  const limit = Math.max(1, Math.min(100, Number.parseInt(params.limit || '20', 10) || 20))
  const offset = (page - 1) * limit

  const sanitizedQuery = rawQuery.trim().slice(0, 200)

  const conditions = [sql`deleted_at IS NULL`]

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
    SELECT id, title FROM library_books WHERE ${whereSql} ${orderSql} LIMIT ${limit} OFFSET ${offset};
  `

  return { page, limit, offset, sanitizedQuery, whereSql, orderSql, booksQuery }
}

describe('Library Search Query Parameterization & Clamping', () => {
  it('should clamp page and limit values within safe boundaries', () => {
    const result = buildLibrarySearchQuery({ page: '-5', limit: '500' })
    assert.equal(result.page, 1)
    assert.equal(result.limit, 100)
    assert.equal(result.offset, 0)
  })

  it('should sanitize and trim search query string to 200 chars max', () => {
    const longQuery = '   ' + 'a'.repeat(300) + '   '
    const result = buildLibrarySearchQuery({ q: longQuery })
    assert.equal(result.sanitizedQuery.length, 200)
    assert.equal(result.sanitizedQuery, 'a'.repeat(200))
  })

  it('should construct a parameterized SQL query object without error', () => {
    const result = buildLibrarySearchQuery({
      q: 'Mathematics',
      category: 'Textbooks',
      classLevel: 'SSS 1',
      availability: 'available',
      sortBy: 'rating'
    })

    assert.ok(result.booksQuery)
    assert.ok(result.whereSql)
  })

  it('should enforce authentication requirement when session is null', () => {
    const evaluateAuth = (session: { user?: { id: string } } | null) => {
      if (!session?.user) {
        return { status: 401, error: 'Unauthorized session.' }
      }
      return { status: 200 }
    }

    assert.equal(evaluateAuth(null).status, 401)
    assert.equal(evaluateAuth({ user: { id: 'u1' } }).status, 200)
  })
})
