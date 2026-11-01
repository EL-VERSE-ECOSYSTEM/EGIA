import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    await db.execute(sql`select 1`)
    return NextResponse.json({ status: 'ready', database: 'ok', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'not_ready', database: 'error', timestamp: new Date().toISOString() }, { status: 503 })
  }
}
