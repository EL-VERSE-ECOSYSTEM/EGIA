import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { feeStructure, user } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth.getSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const uRec = await db.query.user.findFirst({ where: eq(user.id, session.user.id) })
    const schoolId = uRec?.schoolId || session.user.schoolId

    if (!schoolId && session.user.role.toUpperCase() !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'School context is required.' }, { status: 403 })
    }

    const list = schoolId
      ? await db.query.feeStructure.findMany({
          where: eq(feeStructure.schoolId, schoolId),
          orderBy: [desc(feeStructure.createdAt)]
        })
      : await db.query.feeStructure.findMany({ orderBy: [desc(feeStructure.createdAt)] })

    return NextResponse.json({ feeStructures: list })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
