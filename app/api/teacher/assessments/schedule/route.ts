import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { assessmentSchedule, assessment } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 })
    }

    const role = (user.user_metadata?.role || '').toUpperCase()
    if (!['TEACHER', 'ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions.' }, { status: 403 })
    }

    const body = await req.json()
    const { assessmentId, startTime, endTime, classId } = body

    if (!assessmentId || !startTime || !endTime) {
      return NextResponse.json({ error: 'Assessment ID, start time, and end time are required.' }, { status: 400 })
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date/time format provided.' }, { status: 400 })
    }

    if (end <= start) {
      return NextResponse.json({ error: 'End time must be after start time.' }, { status: 400 })
    }

    // Verify assessment exists
    const existingAssessment = await db.query.assessment.findFirst({
      where: eq(assessment.id, assessmentId)
    })

    if (!existingAssessment) {
      return NextResponse.json({ error: 'Assessment record not found.' }, { status: 404 })
    }

    const id = randomUUID()
    await db.insert(assessmentSchedule).values({
      id,
      assessmentId,
      startTime: start,
      endTime: end,
      classId: classId || null
    })

    return NextResponse.json({
      success: true,
      schedule: {
        id,
        assessmentId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
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
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 })
    }

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
