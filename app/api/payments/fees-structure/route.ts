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

    let list = []
    if (schoolId) {
      list = await db.query.feeStructure.findMany({
        where: eq(feeStructure.schoolId, schoolId),
        orderBy: [desc(feeStructure.createdAt)]
      })
    } else {
      list = await db.query.feeStructure.findMany({
        orderBy: [desc(feeStructure.createdAt)]
      })
    }

    return NextResponse.json({ feeStructures: list })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 })
  }
}
