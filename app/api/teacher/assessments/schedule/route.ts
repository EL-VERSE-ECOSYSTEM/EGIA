import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { assessmentSchedule, assessment } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { assessmentId, startTime, endTime, classId } = body

    if (!assessmentId || !startTime || !endTime) {
      return NextResponse.json({ error: 'Assessment ID, start time, and end time are required.' }, { status: 400 })
    }

    const id = randomUUID()
    await db.insert(assessmentSchedule).values({
      id,
      assessmentId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      classId: classId || null
    })

    return NextResponse.json({
      success: true,
      schedule: {
        id,
        assessmentId,
        startTime,
        endTime,
        classId
      }
    })
  } catch (error: any) {
    console.error('Error creating assessment schedule:', error)
    return NextResponse.json({ error: error.message || 'Failed to schedule assessment' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId')

    let list
    if (classId) {
      list = await db.select().from(assessmentSchedule).where(eq(assessmentSchedule.classId, classId)).orderBy(desc(assessmentSchedule.startTime))
    } else {
      list = await db.select().from(assessmentSchedule).orderBy(desc(assessmentSchedule.startTime))
    }

    return NextResponse.json({ success: true, data: list })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch assessment schedules' }, { status: 500 })
  }
}
